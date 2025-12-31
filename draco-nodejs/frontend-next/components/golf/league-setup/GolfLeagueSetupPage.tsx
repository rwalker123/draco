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
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Link from 'next/link';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateGolfLeagueSetupSchema } from '@draco/shared-schemas';
import { UpdateGolfLeagueSetup, getAccountSeason } from '@draco/shared-api-client';
import AccountPageHeader from '../../AccountPageHeader';
import { useGolfLeagueSetup } from '../../../hooks/useGolfLeagueSetup';
import { useApiClient } from '../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../utils/apiResult';
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
  const apiClient = useApiClient();
  const accountIdParam = params?.accountId;
  const accountId = Array.isArray(accountIdParam) ? accountIdParam[0] : accountIdParam;
  const seasonIdParam = params?.seasonId;
  const seasonId = Array.isArray(seasonIdParam) ? seasonIdParam[0] : seasonIdParam;
  const leagueSeasonIdParam = params?.leagueSeasonId;
  const leagueSeasonId = Array.isArray(leagueSeasonIdParam)
    ? leagueSeasonIdParam[0]
    : leagueSeasonIdParam;

  const { setup, loading, updating, error, updateSetup, clearError } = useGolfLeagueSetup(
    accountId,
    seasonId,
    leagueSeasonId,
  );

  const [leagueName, setLeagueName] = useState<string>('');
  const [seasonName, setSeasonName] = useState<string>('');
  const [scheduleExpanded, setScheduleExpanded] = useState(true);
  const [scoringExpanded, setScoringExpanded] = useState(true);
  const [officersExpanded, setOfficersExpanded] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId || !seasonId || !leagueSeasonId) return;

    let isMounted = true;

    const fetchSeasonData = async () => {
      try {
        const result = await getAccountSeason({
          client: apiClient,
          path: { accountId, seasonId },
          throwOnError: false,
        });

        const seasonResult = unwrapApiResult(result, 'Failed to fetch season');
        if (!isMounted) return;

        if (seasonResult.name) {
          setSeasonName(seasonResult.name);
        }

        const league = seasonResult.leagues?.find((l) => l.id === leagueSeasonId);
        if (league?.league?.name) {
          setLeagueName(league.league.name);
        }
      } catch {
        // Silently fail - we'll just show generic title
      }
    };

    void fetchSeasonData();

    return () => {
      isMounted = false;
    };
  }, [accountId, seasonId, leagueSeasonId, apiClient]);

  const methods = useForm<FormData>({
    resolver: zodResolver(UpdateGolfLeagueSetupSchema),
    defaultValues: {},
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = methods;

  useEffect(() => {
    if (setup) {
      reset({
        leagueDay: setup.leagueDay,
        firstTeeTime: setup.firstTeeTime,
        timeBetweenTeeTimes: setup.timeBetweenTeeTimes,
        holesPerMatch: setup.holesPerMatch,
        teamSize: setup.teamSize,
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

  if (!accountId || !seasonId || !leagueSeasonId) {
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
          {leagueName ? `${leagueName} Setup` : 'League Setup'}
        </Typography>
        {seasonName && (
          <Typography variant="body1" sx={{ mt: 0.5, textAlign: 'center', color: 'text.secondary' }}>
            {seasonName}
          </Typography>
        )}
        <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          Configure league day, tee times, and scoring
        </Typography>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
          <MuiLink
            component={Link}
            href={`/account/${accountId}/seasons/${seasonId}/golf/admin`}
            underline="hover"
            color="inherit"
          >
            Golf Admin
          </MuiLink>
          <Typography color="text.primary">
            {leagueName ? `${leagueName} Setup` : 'League Setup'}
          </Typography>
        </Breadcrumbs>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <ScheduleSettingsSection
              control={control}
              expanded={scheduleExpanded}
              onExpandedChange={setScheduleExpanded}
            />

            <ScoringConfigurationSection
              control={control}
              expanded={scoringExpanded}
              onExpandedChange={setScoringExpanded}
            />

            <LeagueOfficersSection
              control={control}
              accountId={accountId}
              expanded={officersExpanded}
              onExpandedChange={setOfficersExpanded}
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
                onClick={() => router.push(`/account/${accountId}/seasons/${seasonId}`)}
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
