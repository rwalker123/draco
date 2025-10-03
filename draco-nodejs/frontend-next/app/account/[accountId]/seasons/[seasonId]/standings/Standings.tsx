'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Container } from '@mui/material';
import AccountPageHeader from '../../../../../../components/AccountPageHeader';
import Standings from '../../../../../../components/Standings';
import { useApiClient } from '@/hooks/useApiClient';
import { listSeasonLeagueSeasons } from '@draco/shared-api-client';
import { unwrapApiResult } from '@/utils/apiResult';
import { mapLeagueSetup } from '@/utils/leagueSeasonMapper';

interface StandingsPageProps {
  accountId: string;
  seasonId: string;
}

export default function StandingsPage({ accountId, seasonId }: StandingsPageProps) {
  const [seasonName, setSeasonName] = useState<string>('');
  const apiClient = useApiClient();

  // Fetch season name
  useEffect(() => {
    async function fetchSeasonName() {
      if (!accountId || !seasonId) return;

      try {
        const result = await listSeasonLeagueSeasons({
          client: apiClient,
          path: { accountId, seasonId },
          throwOnError: false,
        });

        const data = unwrapApiResult(result, 'Failed to load season information');
        const mapped = mapLeagueSetup(data, accountId);
        setSeasonName(mapped.season?.name || '');
      } catch {
        setSeasonName('');
      }
    }

    fetchSeasonName();
  }, [accountId, seasonId, apiClient]);

  if (!seasonId || seasonId === '0') {
    return (
      <main className="min-h-screen bg-background">
        <AccountPageHeader
          accountId={accountId}
          seasonName={seasonName}
          showSeasonInfo={!!seasonName}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            sx={{ position: 'relative' }}
          >
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                Standings
              </Typography>
            </Box>
          </Box>
        </AccountPageHeader>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Invalid season for standings.
          </Typography>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId} seasonName={seasonName} showSeasonInfo={true}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{ position: 'relative' }}
        >
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
              Standings
            </Typography>
          </Box>
        </Box>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Standings accountId={accountId} seasonId={seasonId} showHeader={true} />
      </Container>
    </main>
  );
}
