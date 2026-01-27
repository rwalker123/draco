'use client';

import { useEffect, useMemo, useState } from 'react';
import NextLink from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Box, Breadcrumbs, Container, Link as MuiLink, Typography } from '@mui/material';
import type { PlayerCareerStatisticsType } from '@draco/shared-schemas';
import AccountPageHeader from '../../../../../../components/AccountPageHeader';
import PlayerCareerStatisticsCard from '../../../../../../components/statistics/PlayerCareerStatisticsCard';
import { useApiClient } from '../../../../../../hooks/useApiClient';
import { fetchPlayerCareerStatistics } from '../../../../../../services/statisticsService';

export default function PlayerStatisticsClientWrapper() {
  const params = useParams();
  const rawAccountId = Array.isArray(params.accountId) ? params.accountId[0] : params.accountId;
  const rawPlayerId = Array.isArray(params.playerId) ? params.playerId[0] : params.playerId;

  const accountId = rawAccountId ?? '';
  const playerId = rawPlayerId ?? '';

  const searchParams = useSearchParams();
  const returnDestination = useMemo(() => {
    const target = searchParams?.get('returnTo') ?? null;
    if (!target || !target.startsWith('/')) {
      return null;
    }
    return target;
  }, [searchParams]);

  const breadcrumbLabel = useMemo(() => {
    if (!returnDestination) {
      return null;
    }
    const label = searchParams?.get('returnLabel') ?? '';
    const trimmed = label.trim();
    return trimmed.length > 0 ? trimmed : 'Back';
  }, [returnDestination, searchParams]);

  const apiClient = useApiClient();
  const [playerStats, setPlayerStats] = useState<PlayerCareerStatisticsType | null>(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId) {
      setPlayerStats(null);
      setPlayerError(null);
      return;
    }

    const loadPlayerStats = async () => {
      setPlayerLoading(true);
      setPlayerError(null);

      try {
        const stats = await fetchPlayerCareerStatistics(accountId, playerId, { client: apiClient });
        setPlayerStats(stats);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to load player career statistics';
        setPlayerError(message);
        setPlayerStats(null);
      } finally {
        setPlayerLoading(false);
      }
    };

    void loadPlayerStats();
  }, [playerId, accountId, apiClient]);

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Box sx={{ textAlign: 'center' }}>
          <Box>
            <Typography variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
              Player Statistics
            </Typography>
          </Box>
        </Box>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {returnDestination ? (
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
            <MuiLink
              component={NextLink}
              href={returnDestination}
              prefetch={false}
              underline="hover"
              color="inherit"
            >
              {breadcrumbLabel ?? 'Back'}
            </MuiLink>
            <Typography color="text.primary">Player Statistics</Typography>
          </Breadcrumbs>
        ) : null}

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
