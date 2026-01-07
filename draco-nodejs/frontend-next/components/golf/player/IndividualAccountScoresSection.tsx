'use client';

import React from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { SportsGolf as GolfIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import Link from 'next/link';
import GolferStatsCards from '../stats/GolferStatsCards';
import WidgetShell from '../../ui/WidgetShell';
import { useContactIndividualAccount } from '../../../hooks/useContactIndividualAccount';

interface IndividualAccountScoresSectionProps {
  contactId: string;
}

export default function IndividualAccountScoresSection({
  contactId,
}: IndividualAccountScoresSectionProps) {
  const { data, loading } = useContactIndividualAccount(contactId);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4, mt: 4 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (!data) {
    return null;
  }

  const headerContent = (
    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
      <Box display="flex" alignItems="center" gap={1}>
        <GolfIcon sx={{ color: 'success.main' }} />
        <Typography variant="h6" component="h2" fontWeight={600} color="text.primary">
          Individual Account Scores
        </Typography>
      </Box>
      <Button
        component={Link}
        href={`/account/${data.accountId}/home`}
        size="small"
        endIcon={<OpenInNewIcon />}
        sx={{ textTransform: 'none' }}
      >
        View Full Account
      </Button>
    </Box>
  );

  return (
    <WidgetShell accent="success" headerContent={headerContent} sx={{ mt: 4 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Stats from {data.accountName}
      </Typography>
      <GolferStatsCards
        roundsPlayed={data.roundsPlayed}
        handicapIndex={data.handicapIndex}
        isInitialHandicap={data.isInitialHandicap}
        averageScore={data.averageScore}
        seasonLabel="All-time rounds"
      />
    </WidgetShell>
  );
}
