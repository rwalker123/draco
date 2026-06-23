'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Container, Typography } from '@mui/material';
import AccountPageHeader from '../../../../components/AccountPageHeader';
import { AdminBreadcrumbs } from '../../../../components/admin';
import NotificationSnackbar from '../../../../components/common/NotificationSnackbar';
import { useScheduleData } from '../../../../components/schedule';
import { SeasonSchedulerExperience } from '../../../../components/scheduler/SeasonSchedulerExperience';
import { useCurrentSeason } from '../../../../hooks/useCurrentSeason';
import { useNotifications } from '../../../../hooks/useNotifications';
import { useAccount, useAccountTimezone } from '../../../../context/AccountContext';

interface ScheduleGeneratorProps {
  accountId: string;
}

const ScheduleGenerator: React.FC<ScheduleGeneratorProps> = ({ accountId }) => {
  const { currentSeasonId, currentSeasonName, fetchCurrentSeason } = useCurrentSeason(accountId);
  const timeZone = useAccountTimezone();
  const { currentAccount } = useAccount();
  const accountType = currentAccount?.accountType;

  const { notification, showNotification, hideNotification } = useNotifications();
  const [{ setError, setSuccess }] = useState(() => ({
    setError: (message: string | null) =>
      message ? showNotification(message, 'error') : hideNotification(),
    setSuccess: (message: string | null) =>
      message ? showNotification(message, 'success') : hideNotification(),
  }));
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

      <NotificationSnackbar notification={notification} onClose={hideNotification} />
    </main>
  );
};

export default ScheduleGenerator;
