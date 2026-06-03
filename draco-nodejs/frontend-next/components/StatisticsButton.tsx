import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import { GameCardData } from './GameCard';
import { GameStatus } from '../types/schedule';

interface StatisticsButtonProps {
  game: GameCardData;
  onStatsClick: (e: React.MouseEvent) => void;
  sx?: object;
}

const StatisticsButton: React.FC<StatisticsButtonProps> = ({ game, onStatsClick, sx = {} }) => {
  if (game.gameStatus !== GameStatus.Completed) {
    return null;
  }

  if ((game.teamsWithStats?.length ?? 0) === 0) {
    return null;
  }

  return (
    <Tooltip title="View Game Statistics">
      <IconButton
        size="small"
        onClick={onStatsClick}
        sx={{
          color: 'primary.main',
          p: 0.5,
          '&:hover': {
            color: 'primary.dark',
            bgcolor: 'action.hover',
          },
          ...sx,
        }}
      >
        <BarChartIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </Tooltip>
  );
};

export default StatisticsButton;
