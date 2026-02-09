'use client';

import React from 'react';
import { Alert, Box, Button, CircularProgress, Snackbar, Stack, Typography } from '@mui/material';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import { getAccountHallOfFameNominationSetup } from '@draco/shared-api-client';
import { type HofNominationSetupType } from '@draco/shared-schemas';
import { useApiClient } from '@/hooks/useApiClient';
import { unwrapApiResult } from '@/utils/apiResult';
import { sanitizeRichContent } from '@/utils/sanitization';
import HofNominationDialog from './HofNominationDialog';
import WidgetShell from '../ui/WidgetShell';
import RichTextContent from '../common/RichTextContent';

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

    const controller = new AbortController();

    const loadNominationSetup = async () => {
      setLoading(true);
      try {
        const setupResult = await getAccountHallOfFameNominationSetup({
          client: apiClient,
          path: { accountId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        const setup = unwrapApiResult(
          setupResult,
          'Unable to load Hall of Fame nomination settings.',
        );

        setNominationSetup(setup);
      } catch {
        if (controller.signal.aborted) return;
        setNominationSetup(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadNominationSetup();

    return () => {
      controller.abort();
    };
  }, [accountId, apiClient]);

  const sanitizedCriteria = nominationSetup?.criteriaText
    ? sanitizeRichContent(nominationSetup.criteriaText) || null
    : null;

  if (!loading && (!nominationSetup || !nominationSetup.enableNomination)) {
    return null;
  }

  return (
    <>
      <WidgetShell
        title={
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <HowToVoteIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={700} color="text.primary">
              Nominate a Hall of Fame Member
            </Typography>
          </Stack>
        }
        accent="secondary"
        sx={{
          mt: 3,
          width: { xs: '100%', md: 'fit-content' },
          maxWidth: 520,
        }}
      >
        <Stack spacing={3} alignItems="flex-start" sx={{ minHeight: 0 }}>
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
                  <Alert severity="info" icon={false}>
                    <RichTextContent html={sanitizedCriteria} sanitize={false} />
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
      </WidgetShell>

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
