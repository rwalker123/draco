import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { format } from 'date-fns';
import { Game } from '@/types/schedule';

interface DeleteGameDialogProps {
  open: boolean;
  selectedGame: Game | null;
  onClose: () => void;
  onConfirm: () => void;
  getTeamName: (teamId: string) => string;
}

const DeleteGameDialog: React.FC<DeleteGameDialogProps> = ({
  open,
  selectedGame,
  onClose,
  onConfirm,
  getTeamName,
}) => {
  if (!selectedGame) return null;

  const gameDate = selectedGame.gameDate ? new Date(selectedGame.gameDate) : null;
  const homeTeamName = getTeamName(selectedGame.homeTeamId);
  const visitorTeamName = getTeamName(selectedGame.visitorTeamId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Game</DialogTitle>

      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Are you sure you want to delete this game?
        </Typography>

        <Box sx={{ p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
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

        <Typography variant="body2" sx={{ mt: 2, color: 'error.main' }}>
          This action cannot be undone.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error">
          Delete Game
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteGameDialog;
