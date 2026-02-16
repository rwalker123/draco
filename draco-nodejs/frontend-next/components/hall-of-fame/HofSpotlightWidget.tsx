'use client';

import React from 'react';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useRouter } from 'next/navigation';
import {
  getAccountHallOfFameRandomMember,
  listAccountHallOfFameClasses,
} from '@draco/shared-api-client';
import { HofMemberSchema, MAX_RANDOM_HOF_MEMBERS, type HofMemberType } from '@draco/shared-schemas';
import { useApiClient } from '@/hooks/useApiClient';
import { unwrapApiResult, ApiClientError } from '@/utils/apiResult';
import HofMemberCard from './HofMemberCard';
import WidgetShell from '../ui/WidgetShell';

export interface HofSpotlightWidgetProps {
  accountId: string;
  hideCta?: boolean;
  count?: number;
}

const normalizeId = (value: unknown): unknown =>
  typeof value === 'bigint' ? value.toString() : value;

const coerceMember = (member: unknown): HofMemberType | null => {
  if (!member || typeof member !== 'object') {
    return null;
  }

  const raw = member as Record<string, unknown>;
  const normalized = {
    ...raw,
    id: normalizeId(raw.id),
    accountId: normalizeId(raw.accountId),
    contactId: normalizeId(raw.contactId),
    contact:
      raw.contact && typeof raw.contact === 'object'
        ? {
            ...raw.contact,
            id: normalizeId((raw.contact as Record<string, unknown>).id),
          }
        : raw.contact,
  };

  try {
    return HofMemberSchema.parse(normalized);
  } catch {
    return null;
  }
};

const normalizeCount = (value: number | undefined): number => {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return 1;
  }

  return Math.min(Math.floor(value), MAX_RANDOM_HOF_MEMBERS);
};

const HofSpotlightWidget: React.FC<HofSpotlightWidgetProps> = ({ accountId, hideCta, count }) => {
  const apiClient = useApiClient();
  const router = useRouter();
  const theme = useTheme();

  const memberCount = normalizeCount(count);

  const [hasHallOfFame, setHasHallOfFame] = React.useState(false);
  const [hallOfFameMembers, setHallOfFameMembers] = React.useState<HofMemberType[]>([]);
  const [hallOfFameLoading, setHallOfFameLoading] = React.useState(false);
  const [hallOfFameError, setHallOfFameError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!accountId) {
      return;
    }

    const controller = new AbortController();

    const loadHallOfFame = async () => {
      setHallOfFameLoading(true);
      setHallOfFameError(null);

      try {
        const classesResult = await listAccountHallOfFameClasses({
          client: apiClient,
          path: { accountId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        const classes = unwrapApiResult(classesResult, 'Unable to load Hall of Fame data.');

        const hasClasses = Array.isArray(classes) && classes.length > 0;
        setHasHallOfFame(hasClasses);

        if (hasClasses) {
          try {
            const randomResult = await getAccountHallOfFameRandomMember({
              client: apiClient,
              path: { accountId },
              query: memberCount > 1 ? { count: memberCount } : undefined,
              signal: controller.signal,
              throwOnError: false,
            });

            if (controller.signal.aborted) return;

            const members = unwrapApiResult(randomResult, 'Unable to load Hall of Fame spotlight.');

            const normalizedMembers = (Array.isArray(members) ? members : [members])
              .map(coerceMember)
              .filter(Boolean) as HofMemberType[];

            if (normalizedMembers.length > 0) {
              setHallOfFameMembers(normalizedMembers);
            } else {
              setHallOfFameError('Unable to load Hall of Fame spotlight.');
              setHallOfFameMembers([]);
            }
          } catch (error: unknown) {
            if (controller.signal.aborted) return;
            const message =
              error instanceof ApiClientError
                ? error.message
                : 'Unable to load Hall of Fame spotlight.';
            setHallOfFameError(message);
            setHallOfFameMembers([]);
          }
        } else {
          setHallOfFameMembers([]);
        }
      } catch (error: unknown) {
        if (controller.signal.aborted) return;

        const message =
          error instanceof ApiClientError ? error.message : 'Unable to load Hall of Fame data.';
        setHallOfFameError(message);
        setHasHallOfFame(false);
        setHallOfFameMembers([]);
      } finally {
        if (!controller.signal.aborted) {
          setHallOfFameLoading(false);
        }
      }
    };

    loadHallOfFame();

    return () => {
      controller.abort();
    };
  }, [accountId, apiClient, memberCount]);

  if (!hasHallOfFame) {
    return null;
  }

  return (
    <WidgetShell
      title={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <EmojiEventsIcon sx={{ color: theme.palette.primary.main }} />
          <Typography variant="h6" fontWeight={700} color="text.primary">
            Hall of Fame Spotlight
          </Typography>
        </Stack>
      }
      accent="primary"
      sx={{
        width: '100%',
        maxWidth: '100%',
      }}
    >
      <Stack spacing={3} alignItems="flex-start">
        {hallOfFameLoading ? (
          <Box display="flex" alignItems="center" gap={2}>
            <CircularProgress size={20} />
            <Typography variant="body2">Loading inductees…</Typography>
          </Box>
        ) : hallOfFameError ? (
          <Alert severity="error">{hallOfFameError}</Alert>
        ) : hallOfFameMembers.length > 0 ? (
          <Stack spacing={2} sx={{ width: '100%' }}>
            {hallOfFameMembers.map((member) => (
              <HofMemberCard key={member.id} member={member} />
            ))}
          </Stack>
        ) : (
          <Alert severity="info">Hall of Fame inductees will appear here soon.</Alert>
        )}

        {hideCta ? null : (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              onClick={() => {
                void router.push(`/account/${accountId}/hall-of-fame`);
              }}
            >
              View Hall of Fame
            </Button>
          </Stack>
        )}
      </Stack>
    </WidgetShell>
  );
};

export default HofSpotlightWidget;
