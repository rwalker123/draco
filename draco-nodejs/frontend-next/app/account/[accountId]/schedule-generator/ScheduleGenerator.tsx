'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Box, CircularProgress, Container, Typography } from '@mui/material';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import { AdminBreadcrumbs } from '../../../../components/admin';
import { useScheduleData } from '../../../../components/schedule';
import { SeasonSchedulerExperience } from '../../../../components/scheduler/SeasonSchedulerExperience';
import { useCurrentSeason } from '../../../../hooks/useCurrentSeason';
import { useAccount, useAccountTimezone } from '../../../../context/AccountContext';

interface ScheduleGeneratorProps {
  accountId: string;
}

const ScheduleGenerator: React.FC<ScheduleGeneratorProps> = ({ accountId }) => {
  const { currentSeasonId, currentSeasonName, fetchCurrentSeason } = useCurrentSeason(accountId);
  const timeZone = useAccountTimezone();
  const { currentAccount } = useAccount();
  const accountType = currentAccount?.accountType;

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterDate] = useState(() => new Date());

  useEffect(() => {
    if (accountId) {
      void fetchCurrentSeason();
    }
  }, [accountId, fetchCurrentSeason]);

  const { teams, locations, officials, leagues, hasOfficials, loadOfficials, loadingStaticData } =
    useScheduleData({
      accountId,
      accountType,
      filterType: 'day',
      filterDate,
      timeZone,
      onError: setError,
      mode: 'manage',
    });

  const loadOfficialsRef = useRef(loadOfficials);

  useEffect(() => {
    loadOfficialsRef.current = loadOfficials;
  });

  useEffect(() => {
    if (!hasOfficials) {
      return;
    }
    void loadOfficialsRef.current();
  }, [hasOfficials]);

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 'bold', textAlign: 'center', color: 'text.primary' }}
        >
          Schedule Generator
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          Generate a round-robin schedule around your existing games, then review and apply.
        </Typography>
      </AccountPageHeader>

      <Container maxWidth={false} sx={{ py: 4 }}>
        <AdminBreadcrumbs
          accountId={accountId}
          category={{ name: 'Season', href: `/account/${accountId}/admin/season` }}
          currentPage="Schedule Generator"
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {loadingStaticData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <SeasonSchedulerExperience
            accountId={accountId}
            seasonId={currentSeasonId}
            seasonName={currentSeasonName}
            canEdit={true}
            timeZone={timeZone}
            locations={locations}
            umpires={officials}
            leagues={leagues}
            teams={teams}
            onApplied={async () => {}}
            setSuccess={setSuccess}
            setError={setError}
          />
        )}
      </Container>
    </main>
  );
};

export default ScheduleGenerator;
