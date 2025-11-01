'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Box, Container, Typography } from '@mui/material';
import AccountPageHeader from '../../../../../../components/AccountPageHeader';
import PlayerCareerStatisticsCard from '../../../../../../components/statistics/PlayerCareerStatisticsCard';
import { usePlayerCareerStatistics } from '../../../../../../hooks/usePlayerCareerStatistics';

export default function PlayerStatisticsClientWrapper() {
  const params = useParams();
  const rawAccountId = Array.isArray(params.accountId) ? params.accountId[0] : params.accountId;
  const rawPlayerId = Array.isArray(params.playerId) ? params.playerId[0] : params.playerId;

  const accountId = rawAccountId ?? '';
  const playerId = rawPlayerId ?? '';

  const { playerStats, playerLoading, playerError, loadPlayer, resetPlayer } =
    usePlayerCareerStatistics({ accountId });

  useEffect(() => {
    if (!playerId) {
      resetPlayer();
      return;
    }

    void loadPlayer(playerId);
  }, [playerId, loadPlayer, resetPlayer]);

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Box sx={{ textAlign: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
              Player Statistics
            </Typography>
          </Box>
        </Box>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PlayerCareerStatisticsCard
          stats={playerStats}
          loading={playerLoading}
          error={playerError}
          photoUrl={playerStats?.photoUrl ?? undefined}
        />
      </Container>
    </main>
  );
}
