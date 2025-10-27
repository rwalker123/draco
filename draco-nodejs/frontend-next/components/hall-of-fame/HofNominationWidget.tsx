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
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import { getAccountHallOfFameNominationSetup } from '@draco/shared-api-client';
import { type HofNominationSetupType } from '@draco/shared-schemas';
import { useApiClient } from '@/hooks/useApiClient';
import { unwrapApiResult } from '@/utils/apiResult';
import { sanitizeRichContent } from '@/utils/sanitization';
import HofNominationDialog from './HofNominationDialog';

const NOMINATION_SUCCESS_MESSAGE =
  'Thanks for the nomination! Our administrators will review it shortly.';

export interface HofNominationWidgetProps {
  accountId: string;
}

const HofNominationWidget: React.FC<HofNominationWidgetProps> = ({ accountId }) => {
  const apiClient = useApiClient();
  const [nominationSetup, setNominationSetup] = React.useState<HofNominationSetupType | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);

  React.useEffect(() => {
    if (!accountId) {
      return;
    }

    let isMounted = true;

    const loadNominationSetup = async () => {
      setLoading(true);
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
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

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

  if (!loading && (!nominationSetup || !nominationSetup.enableNomination)) {
    return null;
  }

  return (
    <>
      <Paper
        sx={{
          p: 3,
          borderRadius: 2,
          background:
            'linear-gradient(180deg, rgba(217,231,255,0.35) 0%, rgba(217,231,255,0.1) 100%)',
          boxShadow: '0 12px 32px rgba(15,23,42,0.12)',
          mt: 3,
          width: { xs: '100%', md: 'fit-content' },
          maxWidth: 520,
        }}
      >
        <Stack spacing={3} alignItems="flex-start" sx={{ minHeight: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <HowToVoteIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Nominate a Hall of Fame Member
            </Typography>
          </Stack>

          {loading || !nominationSetup ? (
            <Box display="flex" alignItems="center" gap={2}>
              <CircularProgress size={20} />
              <Typography variant="body2">Loading nomination details…</Typography>
            </Box>
          ) : (
            <Stack
              spacing={2}
              sx={{ width: '100%', minHeight: 0, flexGrow: 1 }}
              alignItems="flex-start"
            >
              <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'stretch' }}>
                Celebrate the leaders, mentors, and standouts who embody your organization&apos;s
                values.
              </Typography>
              {sanitizedCriteria ? (
                <Stack spacing={1} sx={{ alignSelf: 'stretch' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Nomination Criteria
                  </Typography>
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
                </Stack>
              ) : null}
              <Box sx={{ flexGrow: 1 }} />
              <Button
                variant="contained"
                onClick={() => setDialogOpen(true)}
                sx={{ alignSelf: 'flex-start' }}
              >
                Submit Nomination
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>

      {nominationSetup?.enableNomination ? (
        <HofNominationDialog
          accountId={accountId}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmitted={() => {
            setSnackbarOpen(true);
            setDialogOpen(false);
          }}
          criteriaText={nominationSetup.criteriaText ?? undefined}
        />
      ) : null}

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

export default HofNominationWidget;
