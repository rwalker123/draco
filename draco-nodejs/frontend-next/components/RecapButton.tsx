import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { GameCardData } from './GameCard';
import { GameStatus } from '../types/schedule';

interface RecapButtonProps {
  game: GameCardData;
  canEditRecap?: (game: GameCardData) => boolean;
  onEditRecap?: (game: GameCardData) => void;
  onViewRecap?: (game: GameCardData) => void;
  onRecapClick: (e: React.MouseEvent) => void;
  sx?: object;
}

/**
 * Reusable recap button component
 * Eliminates duplication of recap button logic across different layouts in GameCard
 */
const RecapButton: React.FC<RecapButtonProps> = ({
  game,
  canEditRecap,
  onEditRecap,
  onViewRecap,
  onRecapClick,
  sx = {},
}) => {
  // Only show recap button for completed games
  if (game.gameStatus !== GameStatus.Completed) {
    return null;
  }

  // Show edit recap button if user can edit and has edit permissions
  if (canEditRecap && canEditRecap(game) && onEditRecap) {
    return (
      <Tooltip title={game.hasGameRecap ? 'Edit Summary' : 'Enter Summary'}>
        <IconButton
          size="small"
          onClick={onRecapClick}
          sx={{
            color: game.hasGameRecap ? 'warning.main' : 'primary.main',
            p: 0.5,
            '&:hover': {
              color: game.hasGameRecap ? 'warning.dark' : 'primary.dark',
              bgcolor: 'action.hover',
            },
            ...sx,
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  }

  // Show view recap button if game has recap and user can view
  if (game.hasGameRecap && onViewRecap) {
    return (
      <Tooltip title="View Game Summary">
        <IconButton
          size="small"
          onClick={onRecapClick}
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
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  }

  return null;
};

export default RecapButton;
