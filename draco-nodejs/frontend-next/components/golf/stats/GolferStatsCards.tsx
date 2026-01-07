'use client';

import React from 'react';
import { Box, Card, CardContent, Tooltip, Typography } from '@mui/material';
import {
  GolfCourse as GolfCourseIcon,
  TrendingUp as TrendingUpIcon,
  SportsGolf as SportsGolfIcon,
  InfoOutlined as InfoOutlinedIcon,
} from '@mui/icons-material';

export interface GolferStatsCardsProps {
  roundsPlayed: number;
  handicapIndex: number | null;
  isInitialHandicap?: boolean;
  averageScore: number | null;
  seasonLabel?: string;
}

export default function GolferStatsCards({
  roundsPlayed,
  handicapIndex,
  isInitialHandicap = false,
  averageScore,
  seasonLabel = 'Total rounds',
}: GolferStatsCardsProps) {
  const getHandicapSubtitle = () => {
    if (handicapIndex === null) {
      return 'Enter 3+ scores to calculate';
    }
    if (isInitialHandicap) {
      return 'Initial handicap (manual entry)';
    }
    return 'Based on recent rounds';
  };
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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Typography variant="h3" color="success.main">
              {handicapIndex != null ? handicapIndex.toFixed(1) : '--'}
            </Typography>
            {isInitialHandicap && handicapIndex != null && (
              <Tooltip
                title="This handicap was manually entered and is not calculated from recent rounds"
                arrow
              >
                <InfoOutlinedIcon sx={{ fontSize: 24, color: 'text.secondary', cursor: 'help' }} />
              </Tooltip>
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {getHandicapSubtitle()}
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
