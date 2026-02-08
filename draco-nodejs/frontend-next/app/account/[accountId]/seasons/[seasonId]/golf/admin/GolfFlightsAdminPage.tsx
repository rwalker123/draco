'use client';

import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, CircularProgress } from '@mui/material';
import Grid from '@mui/material/Grid';
import GroupsIcon from '@mui/icons-material/Groups';
import SettingsIcon from '@mui/icons-material/Settings';
import { getAccountSeason } from '@draco/shared-api-client';
import AccountPageHeader from '../../../../../../../components/AccountPageHeader';
import { AdminBreadcrumbs } from '../../../../../../../components/admin';
import AdminSubItemCard from '../../../../../../../components/admin/AdminSubItemCard';
import { useApiClient } from '../../../../../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../../../../../utils/apiResult';

interface GolfFlightsAdminPageProps {
  accountId: string;
  seasonId: string;
}

const GolfFlightsAdminPage: React.FC<GolfFlightsAdminPageProps> = ({ accountId, seasonId }) => {
  const [leagueSeasonId, setLeagueSeasonId] = useState<string>('');
  const [seasonName, setSeasonName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const apiClient = useApiClient();

  useEffect(() => {
    let isMounted = true;

    const fetchSeason = async () => {
      try {
        const result = await getAccountSeason({
          client: apiClient,
          path: { accountId, seasonId },
          throwOnError: false,
        });

        const seasonResult = unwrapApiResult(result, 'Failed to fetch season');
        if (!isMounted) return;

        setSeasonName(seasonResult.name);

        if (seasonResult.leagues && seasonResult.leagues.length > 0) {
          setLeagueSeasonId(seasonResult.leagues[0].id);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchSeason();

    return () => {
      isMounted = false;
    };
  }, [accountId, seasonId, apiClient]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
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
          Flights Administration
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
          {seasonName ? `Manage teams and settings for ${seasonName}` : 'Manage teams and settings'}
        </Typography>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <AdminBreadcrumbs
          accountId={accountId}
          links={[
            { name: 'Season', href: `/account/${accountId}/admin/season` },
            { name: 'Season Management', href: `/account/${accountId}/seasons` },
            ...(seasonName
              ? [{ name: seasonName, href: `/account/${accountId}/seasons/${seasonId}/golf/admin` }]
              : []),
          ]}
          currentPage="Flights Administration"
        />
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <AdminSubItemCard
              title="Flights & Teams"
              description="Manage flights and teams for this season"
              icon={<GroupsIcon />}
              href={`/account/${accountId}/seasons/${seasonId}/golf/flights`}
            />
          </Grid>
          {leagueSeasonId && (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <AdminSubItemCard
                title="Setup"
                description="Configure league day, tee times, and scoring"
                icon={<SettingsIcon />}
                href={`/account/${accountId}/seasons/${seasonId}/golf/leagues/${leagueSeasonId}/setup`}
              />
            </Grid>
          )}
        </Grid>
      </Container>
    </main>
  );
};

export default GolfFlightsAdminPage;
