'use client';

import React from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useRouter } from 'next/navigation';
import {
  getAccountHallOfFameRandomMember,
  listAccountHallOfFameClasses,
} from '@draco/shared-api-client';
import { HofMemberSchema, type HofMemberType } from '@draco/shared-schemas';
import { useApiClient } from '@/hooks/useApiClient';
import { unwrapApiResult, ApiClientError } from '@/utils/apiResult';
import HofMemberCard from './HofMemberCard';

export interface HofSpotlightWidgetProps {
  accountId: string;
  hideCta?: boolean;
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

const HofSpotlightWidget: React.FC<HofSpotlightWidgetProps> = ({ accountId, hideCta }) => {
  const apiClient = useApiClient();
  const router = useRouter();
  const theme = useTheme();

  const surfaceBorderColor = alpha(
    theme.palette.primary.main,
    theme.palette.mode === 'dark' ? 0.45 : 0.18,
  );

  const [hasHallOfFame, setHasHallOfFame] = React.useState(false);
  const [hallOfFameMember, setHallOfFameMember] = React.useState<HofMemberType | null>(null);
  const [hallOfFameLoading, setHallOfFameLoading] = React.useState(false);
  const [hallOfFameError, setHallOfFameError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!accountId) {
      return;
    }

    let isMounted = true;

    const loadHallOfFame = async () => {
      setHallOfFameLoading(true);
      setHallOfFameError(null);

      try {
        const classesResult = await listAccountHallOfFameClasses({
          client: apiClient,
          path: { accountId },
          throwOnError: false,
        });

        const classes = unwrapApiResult(classesResult, 'Unable to load Hall of Fame data.');

        if (!isMounted) {
          return;
        }

        const hasClasses = Array.isArray(classes) && classes.length > 0;
        setHasHallOfFame(hasClasses);

        if (hasClasses) {
          try {
            const randomResult = await getAccountHallOfFameRandomMember({
              client: apiClient,
              path: { accountId },
              throwOnError: false,
            });

            const member = unwrapApiResult(randomResult, 'Unable to load Hall of Fame spotlight.');

            if (isMounted) {
              const normalizedMember = coerceMember(member);
              if (normalizedMember) {
                setHallOfFameMember(normalizedMember);
              } else {
                setHallOfFameError('Unable to load Hall of Fame spotlight.');
                setHallOfFameMember(null);
              }
            }
          } catch (error) {
            if (isMounted) {
              const message =
                error instanceof ApiClientError
                  ? error.message
                  : 'Unable to load Hall of Fame spotlight.';
              setHallOfFameError(message);
              setHallOfFameMember(null);
            }
          }
        } else {
          setHallOfFameMember(null);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof ApiClientError ? error.message : 'Unable to load Hall of Fame data.';
        setHallOfFameError(message);
        setHasHallOfFame(false);
        setHallOfFameMember(null);
      } finally {
        if (isMounted) {
          setHallOfFameLoading(false);
        }
      }
    };

    loadHallOfFame();

    return () => {
      isMounted = false;
    };
  }, [accountId, apiClient]);

  if (!hasHallOfFame) {
    return null;
  }

  return (
    <>
      <Paper
        sx={{
          p: 3,
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          border: '1px solid',
          borderColor: surfaceBorderColor,
          boxShadow: theme.shadows[3],
          mt: 3,
          width: { xs: '100%', md: 'fit-content' },
          maxWidth: 520,
          transition: 'box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: theme.shadows[6],
          },
        }}
      >
        <Stack spacing={3} alignItems="flex-start">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <EmojiEventsIcon sx={{ color: theme.palette.primary.main }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
              Hall of Fame Spotlight
            </Typography>
          </Stack>

          {hallOfFameLoading ? (
            <Box display="flex" alignItems="center" gap={2}>
              <CircularProgress size={20} />
              <Typography variant="body2">Loading inductees…</Typography>
            </Box>
          ) : hallOfFameError ? (
            <Alert severity="error">{hallOfFameError}</Alert>
          ) : hallOfFameMember ? (
            <HofMemberCard member={hallOfFameMember} />
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
      </Paper>
    </>
  );
};

export default HofSpotlightWidget;
