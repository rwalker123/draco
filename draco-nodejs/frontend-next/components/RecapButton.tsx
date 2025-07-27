import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { GameCardData } from './GameCard';
import { GameStatus } from '../types/schedule';

type RecapButtonProps = {
  game: GameCardData;
  onRecapClick: (e: React.MouseEvent) => void;
  sx?: object;
} & (
  | { recapMode: 'none' }
  | { recapMode: 'view'; onViewRecap: (game: GameCardData) => void }
  | {
      recapMode: 'edit';
      canEditRecap: (game: GameCardData) => boolean;
      onEditRecap: (game: GameCardData) => void;
    }
);

/**
 * Reusable recap button component
 * Eliminates duplication of recap button logic across different layouts in GameCard
 */
const RecapButton: React.FC<RecapButtonProps> = (props) => {
  const { game, onRecapClick, sx = {} } = props;

  // Only show recap button for completed games
  if (game.gameStatus !== GameStatus.Completed) {
    return null;
  }

  // Show edit recap button if user can edit and has edit permissions
  if (props.recapMode === 'edit' && props.canEditRecap(game)) {
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
  if (props.recapMode === 'view' && game.hasGameRecap) {
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
