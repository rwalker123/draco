import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { format } from 'date-fns';
import { Game } from '@/types/schedule';
import { useGameDeletion, type DeleteGameResult } from '../hooks/useGameDeletion';
import ConfirmDeleteDialog from '../../social/ConfirmDeleteDialog';

const SCORES_ERROR_MESSAGE = 'Cannot delete match because it has recorded scores';

interface DeleteGameDialogProps {
  open: boolean;
  selectedGame: Game | null;
  onClose: () => void;
  onSuccess?: (result: DeleteGameResult) => void;
  onError?: (message: string) => void;
  getTeamName: (teamId: string) => string;
  accountId: string;
  onDelete?: (game: Game, force?: boolean) => Promise<void>;
}

const DeleteGameDialog: React.FC<DeleteGameDialogProps> = ({
  open,
  selectedGame,
  onClose,
  onSuccess,
  onError,
  getTeamName,
  accountId,
  onDelete,
}) => {
  const {
    deleteGame: defaultDeleteGame,
    loading,
    error,
    resetError,
  } = useGameDeletion({ accountId });

  const [forceDeleteOffered, setForceDeleteOffered] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const prevGameIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      resetError();
    }
  }, [open, resetError]);

  const handleClose = useCallback(() => {
    if (loading) {
      return;
    }

    resetError();
    setForceDeleteOffered(false);
    setDeleteError(null);
    onClose();
  }, [loading, onClose, resetError]);

  const currentGameId = selectedGame?.id ?? null;
  if (currentGameId !== prevGameIdRef.current) {
    prevGameIdRef.current = currentGameId;
    if (forceDeleteOffered || deleteError) {
      setForceDeleteOffered(false);
      setDeleteError(null);
    }
  }

  const handleConfirm = useCallback(async () => {
    if (!selectedGame) {
      return;
    }

    setDeleteError(null);

    try {
      if (onDelete) {
        await onDelete(selectedGame, forceDeleteOffered);
        onSuccess?.({ message: 'Game deleted successfully', gameId: selectedGame.id });
      } else {
        const result = await defaultDeleteGame(selectedGame);
        onSuccess?.(result);
      }
      resetError();
      setForceDeleteOffered(false);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete game';

      if (message.includes(SCORES_ERROR_MESSAGE) && !forceDeleteOffered) {
        setForceDeleteOffered(true);
        setDeleteError(message);
      } else {
        setDeleteError(message);
        onError?.(message);
      }
    }
  }, [
    defaultDeleteGame,
    forceDeleteOffered,
    onClose,
    onDelete,
    onError,
    onSuccess,
    resetError,
    selectedGame,
  ]);

  if (!selectedGame) return null;

  const gameDate = selectedGame.gameDate ? new Date(selectedGame.gameDate) : null;
  const homeTeamName = getTeamName(selectedGame.homeTeamId);
  const visitorTeamName = getTeamName(selectedGame.visitorTeamId);

  const displayError = deleteError || error;

  return (
    <ConfirmDeleteDialog
      open={open}
      title="Delete Game"
      message={
        forceDeleteOffered
          ? 'This game has recorded scores. Are you sure you want to delete it along with all scores?'
          : 'Are you sure you want to delete this game?'
      }
      content={
        <>
          <Box sx={{ p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Game Details:
            </Typography>

            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Date:</strong> {gameDate ? format(gameDate, 'EEEE, MMMM d, yyyy') : 'TBD'}
            </Typography>

            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Time:</strong> {gameDate ? format(gameDate, 'h:mm a') : 'TBD'}
            </Typography>

            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Matchup:</strong> {homeTeamName} vs {visitorTeamName}
            </Typography>

            {selectedGame.field && (
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Field:</strong> {selectedGame.field.name}
              </Typography>
            )}

            {selectedGame.comment && (
              <Typography variant="body2">
                <strong>Comments:</strong> {selectedGame.comment}
              </Typography>
            )}
          </Box>

          {displayError && (
            <Alert severity={forceDeleteOffered ? 'warning' : 'error'} sx={{ mt: 2 }}>
              {displayError}
            </Alert>
          )}

          <Typography variant="body2" sx={{ mt: 2, color: 'error.main' }}>
            {forceDeleteOffered
              ? 'This will permanently delete the game and all recorded scores.'
              : 'This action cannot be undone.'}
          </Typography>
        </>
      }
      onClose={handleClose}
      onConfirm={handleConfirm}
      confirmLabel={forceDeleteOffered ? 'Delete Game and Scores' : 'Delete Game'}
      confirmButtonProps={{ variant: 'contained', color: 'error', disabled: loading }}
      cancelButtonProps={{ variant: 'outlined', disabled: loading }}
      dialogProps={{ maxWidth: 'sm', fullWidth: true }}
    />
  );
};

export default DeleteGameDialog;
