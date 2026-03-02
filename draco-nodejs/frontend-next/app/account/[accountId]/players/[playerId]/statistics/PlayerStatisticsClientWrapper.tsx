'use client';

import NextLink from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Box, Breadcrumbs, Container, Link as MuiLink, Typography } from '@mui/material';
import AccountPageHeader from '../../../../../../components/AccountPageHeader';
import PlayerCareerStatisticsCard from '../../../../../../components/statistics/PlayerCareerStatisticsCard';
import { usePlayerCareerStatistics } from '../../../../../../hooks/usePlayerCareerStatistics';

export default function PlayerStatisticsClientWrapper() {
  const params = useParams();
  const rawAccountId = Array.isArray(params.accountId) ? params.accountId[0] : params.accountId;
  const rawPlayerId = Array.isArray(params.playerId) ? params.playerId[0] : params.playerId;

  const accountId = rawAccountId ?? '';
  const playerId = rawPlayerId ?? '';

  const searchParams = useSearchParams();
  const returnTarget = searchParams?.get('returnTo') ?? null;
  const returnDestination = returnTarget && returnTarget.startsWith('/') ? returnTarget : null;

  const breadcrumbLabel = returnDestination
    ? (searchParams?.get('returnLabel') ?? '').trim() || 'Back'
    : null;

  const { playerStats, playerLoading, playerError } = usePlayerCareerStatistics({
    accountId,
    playerId,
  });

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
