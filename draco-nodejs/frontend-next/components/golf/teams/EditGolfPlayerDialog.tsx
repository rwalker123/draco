'use client';

import React, { useState, useEffect } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { GolfRosterEntryType, UpdateGolfPlayerType } from '@draco/shared-schemas';

interface EditGolfPlayerDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateGolfPlayerType) => Promise<void>;
  player: GolfRosterEntryType | null;
  teamName?: string;
}

const EditGolfPlayerDialog: React.FC<EditGolfPlayerDialogProps> = ({
  open,
  onClose,
  onSubmit,
  player,
  teamName,
}) => {
  const [initialDifferential, setInitialDifferential] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && player) {
      setInitialDifferential(player.initialDifferential ?? null);
      setError(null);
    }
  }, [open, player]);

  const handleSubmit = async () => {
    if (!player) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const updateData: UpdateGolfPlayerType = {
        initialDifferential,
        isActive: player.isActive,
      };
      await onSubmit(updateData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update player');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!player) {
    return null;
  }

  const playerName = [player.player.firstName, player.player.lastName].filter(Boolean).join(' ');

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Player{teamName ? ` - ${teamName}` : ''}</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            {playerName}
          </Typography>

          <FormControl fullWidth>
            <FormLabel htmlFor="player-differential">Initial Handicap Index</FormLabel>
            <TextField
              id="player-differential"
              type="number"
              placeholder="e.g., 12.5"
              value={initialDifferential ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                setInitialDifferential(val === '' ? null : parseFloat(val));
              }}
              helperText="Used for initial handicap calculations"
              disabled={isSubmitting}
              size="small"
              fullWidth
              inputProps={{ step: 0.1 }}
            />
          </FormControl>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? <CircularProgress size={20} /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditGolfPlayerDialog;
