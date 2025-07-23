'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Container } from '@mui/material';
import AccountPageHeader from '../../../../../../components/AccountPageHeader';
import Standings from '/Users/raywalker/source/Draco/draco-nodejs/frontend-next/components/Standings';

interface StandingsPageProps {
  accountId: string;
  seasonId: string;
}

export default function StandingsPage({ accountId, seasonId }: StandingsPageProps) {
  const [seasonName, setSeasonName] = useState<string>('');

  // Fetch season name
  useEffect(() => {
    async function fetchSeasonName() {
      if (!accountId || !seasonId) return;
      try {
        const res = await fetch(`/api/accounts/${accountId}/seasons/${seasonId}`);
        if (res.ok) {
          const data = await res.json();
          setSeasonName(data.data?.season?.name || '');
        } else {
          setSeasonName('');
        }
      } catch {
        setSeasonName('');
      }
    }
    fetchSeasonName();
  }, [accountId, seasonId]);

  if (!seasonId || seasonId === '0') {
    return (
      <main className="min-h-screen bg-background">
        <AccountPageHeader accountId={accountId}>
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
      <AccountPageHeader accountId={accountId}>
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
            {seasonName && (
              <Typography
                variant="h6"
                sx={{ mt: 1, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}
              >
                {seasonName} Season
              </Typography>
            )}
          </Box>
        </Box>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Standings accountId={accountId} seasonId={seasonId} showHeader={true} />
      </Container>
    </main>
  );
}
