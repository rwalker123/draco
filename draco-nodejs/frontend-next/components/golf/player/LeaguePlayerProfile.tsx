'use client';

import React, { useState } from 'react';
import { Box, CircularProgress, Container, Typography, Button } from '@mui/material';
import NotificationSnackbar from '../../common/NotificationSnackbar';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import GolferStatsCards from '../stats/GolferStatsCards';
import GolfScoresList from '../scores/GolfScoresList';
import IndividualAccountScoresSection from './IndividualAccountScoresSection';
import { useLeaguePlayerProfile } from '../../../hooks/useLeaguePlayerProfile';

export interface LeaguePlayerProfileProps {
  accountId: string;
  contactId: string;
  playerName?: string;
}

export default function LeaguePlayerProfile({
  accountId,
  contactId,
  playerName,
}: LeaguePlayerProfileProps) {
  const router = useRouter();
  const { data, loading, error } = useLeaguePlayerProfile(accountId, contactId);
  const [errorDismissed, setErrorDismissed] = useState(false);

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Button variant="text" startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          Back to Leaderboard
        </Button>
        {playerName && (
          <Typography variant="h4" component="h1" gutterBottom>
            {playerName}
          </Typography>
        )}
        <Typography variant="body1" color="text.secondary">
          League Match Scores
        </Typography>
      </Box>

      <GolferStatsCards
        roundsPlayed={data?.roundsPlayed ?? 0}
        handicapIndex={data?.handicapIndex ?? null}
        isInitialHandicap={data?.isInitialHandicap ?? false}
        averageScore={data?.averageScore ?? null}
        seasonLabel="League rounds"
      />

      <IndividualAccountScoresSection contactId={contactId} />

      <GolfScoresList
        scores={data?.scores ?? []}
        contributingIndices={data?.contributingIndices ?? new Set()}
        showOwnerActions={false}
        title="League Match Scores"
        emptyMessage="No league match scores recorded yet."
      />

      <NotificationSnackbar
        notification={error && !errorDismissed ? { message: error, severity: 'error' } : null}
        onClose={() => setErrorDismissed(true)}
      />
    </Container>
  );
}
