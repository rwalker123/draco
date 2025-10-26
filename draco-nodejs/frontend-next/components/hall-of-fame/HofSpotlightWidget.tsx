'use client';

import React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useRouter } from 'next/navigation';
import {
  getAccountHallOfFameNominationSetup,
  getAccountHallOfFameRandomMember,
  listAccountHallOfFameClasses,
} from '@draco/shared-api-client';
import {
  HofMemberSchema,
  type HofMemberType,
  type HofNominationSetupType,
} from '@draco/shared-schemas';
import { useApiClient } from '@/hooks/useApiClient';
import { unwrapApiResult, ApiClientError } from '@/utils/apiResult';
import { sanitizeRichContent } from '@/utils/sanitization';
import HofMemberCard from './HofMemberCard';
import HofNominationDialog from './HofNominationDialog';

const NOMINATION_SUCCESS_MESSAGE =
  'Thanks for the nomination! Our administrators will review it shortly.';

export interface HofSpotlightWidgetProps {
  accountId: string;
}

const HofSpotlightWidget: React.FC<HofSpotlightWidgetProps> = ({ accountId }) => {
  const apiClient = useApiClient();
  const router = useRouter();

  const [hasHallOfFame, setHasHallOfFame] = React.useState(false);
  const [hallOfFameMember, setHallOfFameMember] = React.useState<HofMemberType | null>(null);
  const [hallOfFameLoading, setHallOfFameLoading] = React.useState(false);
  const [hallOfFameError, setHallOfFameError] = React.useState<string | null>(null);
  const [nominationSetup, setNominationSetup] = React.useState<HofNominationSetupType | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);

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
              const normalizedMember = HofMemberSchema.parse(member);
              setHallOfFameMember(normalizedMember);
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

    const loadNominationSetup = async () => {
      try {
        const setupResult = await getAccountHallOfFameNominationSetup({
          client: apiClient,
          path: { accountId },
          throwOnError: false,
        });

        const setup = unwrapApiResult(
          setupResult,
          'Unable to load Hall of Fame nomination settings.',
        );

        if (isMounted) {
          setNominationSetup(setup);
        }
      } catch {
        if (isMounted) {
          setNominationSetup(null);
        }
      }
    };

    loadHallOfFame();
    loadNominationSetup();

    return () => {
      isMounted = false;
    };
  }, [accountId, apiClient]);

  const sanitizedCriteria = React.useMemo(() => {
    if (!nominationSetup?.criteriaText) {
      return null;
    }

    const sanitized = sanitizeRichContent(nominationSetup.criteriaText);
    return sanitized.length > 0 ? sanitized : null;
  }, [nominationSetup]);

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleNominationSuccess = () => {
    setSnackbarOpen(true);
  };

  if (!hasHallOfFame) {
    return null;
  }

  return (
    <>
      <Paper
        sx={{
          p: 3,
          borderRadius: 2,
          background:
            'linear-gradient(180deg, rgba(246,238,205,0.35) 0%, rgba(246,238,205,0.1) 100%)',
          boxShadow: '0 12px 32px rgba(15,23,42,0.12)',
          mt: 3,
        }}
      >
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <EmojiEventsIcon sx={{ color: 'warning.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
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

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="outlined"
              onClick={() => {
                void router.push(`/account/${accountId}/hall-of-fame`);
              }}
            >
              View Hall of Fame
            </Button>
            {nominationSetup?.enableNomination ? (
              <Button variant="contained" onClick={() => setDialogOpen(true)}>
                Submit Nomination
              </Button>
            ) : null}
          </Stack>

          {sanitizedCriteria ? (
            <Alert
              severity="info"
              icon={false}
              sx={{ '& p': { mb: 0.5, '&:last-of-type': { mb: 0 } } }}
            >
              <Typography
                component="div"
                variant="body2"
                dangerouslySetInnerHTML={{ __html: sanitizedCriteria }}
              />
            </Alert>
          ) : null}
        </Stack>
      </Paper>

      {nominationSetup?.enableNomination && (
        <HofNominationDialog
          accountId={accountId}
          open={dialogOpen}
          onClose={handleDialogClose}
          onSubmitted={handleNominationSuccess}
          criteriaText={nominationSetup.criteriaText ?? undefined}
        />
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert severity="success" onClose={() => setSnackbarOpen(false)}>
          {NOMINATION_SUCCESS_MESSAGE}
        </Alert>
      </Snackbar>
    </>
  );
};

export default HofSpotlightWidget;
