'use client';

import React from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Typography,
} from '@mui/material';
import type { ScoreEntryDialogProps } from '../types/sportAdapter';

const GolfScoreEntryDialog: React.FC<ScoreEntryDialogProps> = ({
  open,
  selectedGame,
  onClose,
  getTeamName,
}) => {
  if (!selectedGame) return null;

  const team1Name = getTeamName(selectedGame.homeTeamId);
  const team2Name = getTeamName(selectedGame.visitorTeamId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <Box sx={{ p: 3, pb: 1 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Enter Golf Scores
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {team1Name} vs {team2Name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {new Date(selectedGame.gameDate).toLocaleDateString()}
        </Typography>
      </Box>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Golf scorecard entry is not yet implemented. This feature will allow entry of 18-hole
          scores for each player, with automatic calculation of team totals and match results.
        </Alert>

        <Box
          sx={{
            p: 4,
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            textAlign: 'center',
            color: 'text.secondary',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Coming Soon: 18-Hole Scorecard
          </Typography>
          <Typography variant="body2">
            • Player-by-player score entry
            <br />
            • Gross and net score calculations
            <br />
            • Team totals and match points
            <br />• Automatic status updates
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default GolfScoreEntryDialog;
