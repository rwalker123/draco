'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateGolfLeagueSetupSchema } from '@draco/shared-schemas';
import { UpdateGolfLeagueSetup } from '@draco/shared-api-client';
import AccountPageHeader from '../../AccountPageHeader';
import { useGolfLeagueSetup } from '../../../hooks/useGolfLeagueSetup';
import { ScheduleSettingsSection } from './ScheduleSettingsSection';
import { LeagueOfficersSection } from './LeagueOfficersSection';
import { ScoringConfigurationSection } from './ScoringConfigurationSection';

interface FormData extends UpdateGolfLeagueSetup {
  presidentId?: string;
  vicePresidentId?: string;
  secretaryId?: string;
  treasurerId?: string;
}

export function GolfLeagueSetupPage() {
  const params = useParams();
  const router = useRouter();
  const accountIdParam = params?.accountId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;

  const { setup, loading, updating, error, updateSetup, clearError } = useGolfLeagueSetup(accountId);

  const [scheduleExpanded, setScheduleExpanded] = useState(true);
  const [officersExpanded, setOfficersExpanded] = useState(true);
  const [scoringExpanded, setScoringExpanded] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const methods = useForm<FormData>({
    resolver: zodResolver(UpdateGolfLeagueSetupSchema),
    defaultValues: {},
  });

  const { control, handleSubmit, reset, formState: { isDirty } } = methods;

  useEffect(() => {
    if (setup) {
      reset({
        leagueDay: setup.leagueDay,
        firstTeeTime: setup.firstTeeTime,
        timeBetweenTeeTimes: setup.timeBetweenTeeTimes,
        holesPerMatch: setup.holesPerMatch,
        presidentId: setup.president?.id,
        vicePresidentId: setup.vicePresident?.id,
        secretaryId: setup.secretary?.id,
        treasurerId: setup.treasurer?.id,
        scoringType: setup.scoringType,
        useBestBall: setup.useBestBall,
        useHandicapScoring: setup.useHandicapScoring,
        perHolePoints: setup.perHolePoints,
        perNinePoints: setup.perNinePoints,
        perMatchPoints: setup.perMatchPoints,
        totalHolesPoints: setup.totalHolesPoints,
        againstFieldPoints: setup.againstFieldPoints,
        againstFieldDescPoints: setup.againstFieldDescPoints,
      });
    }
  }, [setup, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await updateSetup(data);
      setSuccessMessage('League setup saved successfully');
    } catch {
      // Error is handled by the hook
    }
  };

  if (!accountId) {
    return null;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 'bold', textAlign: 'center', color: 'text.primary' }}
        >
          League Setup
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          Configure your golf league settings
        </Typography>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <ScheduleSettingsSection
              control={control}
              expanded={scheduleExpanded}
              onExpandedChange={setScheduleExpanded}
            />

            <LeagueOfficersSection
              control={control}
              accountId={accountId}
              expanded={officersExpanded}
              onExpandedChange={setOfficersExpanded}
            />

            <ScoringConfigurationSection
              control={control}
              expanded={scoringExpanded}
              onExpandedChange={setScoringExpanded}
            />

            <Box
              sx={{
                position: 'sticky',
                bottom: 16,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 2,
                mt: 3,
                p: 2,
                bgcolor: 'background.paper',
                borderRadius: 1,
                boxShadow: 3,
              }}
            >
              <Button
                variant="outlined"
                onClick={() => router.push(`/account/${accountId}/admin`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={updating ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                disabled={updating || !isDirty}
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </form>
        </FormProvider>
      </Container>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={clearError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={clearError}>
          {error}
        </Alert>
      </Snackbar>
    </main>
  );
}

export default GolfLeagueSetupPage;
