'use client';

import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import {
  GolfCourse as GolfCourseIcon,
  TrendingUp as TrendingUpIcon,
  SportsGolf as SportsGolfIcon,
} from '@mui/icons-material';

export interface GolferStatsCardsProps {
  roundsPlayed: number;
  handicapIndex: number | null;
  averageScore: number | null;
  seasonLabel?: string;
}

export default function GolferStatsCards({
  roundsPlayed,
  handicapIndex,
  averageScore,
  seasonLabel = 'Total rounds',
}: GolferStatsCardsProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        gap: 3,
        mb: 4,
      }}
    >
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <SportsGolfIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Rounds Played
          </Typography>
          <Typography variant="h3" color="primary.main">
            {roundsPlayed}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {seasonLabel}
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <TrendingUpIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Handicap Index
          </Typography>
          <Typography variant="h3" color="success.main">
            {handicapIndex != null ? handicapIndex.toFixed(1) : '--'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {handicapIndex != null ? 'Based on recent rounds' : 'Enter 3+ scores to calculate'}
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <GolfCourseIcon sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Average Score
          </Typography>
          <Typography variant="h3" color="info.main">
            {averageScore != null ? Math.round(averageScore) : '--'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Per 18 holes
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
