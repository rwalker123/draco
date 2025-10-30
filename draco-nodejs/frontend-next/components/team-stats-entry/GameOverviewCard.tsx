'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import type { TeamCompletedGameType } from '@draco/shared-schemas';

import { formatGameDate, getOpponentLabel } from './utils';

interface GameOverviewCardProps {
  game: TeamCompletedGameType | null;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const GameOverviewCard: React.FC<GameOverviewCardProps> = ({ game, onRefresh, refreshing }) => {
  const canRefresh = Boolean(game && onRefresh);

  return (
    <Card>
      <CardHeader
        title="Game Overview"
        subheader={game ? formatGameDate(game.gameDate) : undefined}
        action={
          canRefresh ? (
            <Tooltip title="Refresh game statistics">
              <span>
                <IconButton onClick={onRefresh} disabled={refreshing} aria-label="Refresh stats">
                  <Refresh />
                </IconButton>
              </span>
            </Tooltip>
          ) : undefined
        }
      />
      <Divider />
      <CardContent>
        {game ? (
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {getOpponentLabel(game)}
            </Typography>
            <Typography variant="body1">
              Final Score: {game.homeScore} - {game.visitorScore}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Game Status Code: {game.gameStatus}
            </Typography>
          </Stack>
        ) : (
          <Typography variant="body1">
            Select a completed game to review the statistics and, if permitted, record updates.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default GameOverviewCard;
