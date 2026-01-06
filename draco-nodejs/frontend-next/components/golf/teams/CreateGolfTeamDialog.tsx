'use client';

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import type { GolfTeamType } from '@draco/shared-schemas';
import { useGolfTeams } from '../../../hooks/useGolfTeams';

interface CreateGolfTeamDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  flightId: string;
  flightName?: string;
  onSuccess: (team: GolfTeamType, message: string) => void;
  onError?: (error: string) => void;
}

const CreateGolfTeamDialog: React.FC<CreateGolfTeamDialogProps> = ({
  open,
  onClose,
  accountId,
  flightId,
  flightName,
  onSuccess,
  onError,
}) => {
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const teamService = useGolfTeams(accountId);

  const resetForm = useCallback(() => {
    setTeamName('');
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!teamName.trim() || !flightId) return;

    setLoading(true);
    setError(null);

    try {
      const createResult = await teamService.createTeam(flightId, {
        name: teamName.trim(),
      });

      if (!createResult.success) {
        setError(createResult.error);
        onError?.(createResult.error);
        return;
      }

      const successMessage = `Team "${createResult.data.name}" created successfully${flightName ? ` in ${flightName}` : ''}`;
      onSuccess(createResult.data, successMessage);
      handleClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create team';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [teamName, flightId, flightName, teamService, onSuccess, onError, handleClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Team</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {flightName && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Creating team for flight: <strong>{flightName}</strong>
          </Typography>
        )}
        <TextField
          autoFocus
          margin="dense"
          label="Team Name"
          fullWidth
          variant="outlined"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          disabled={loading}
          sx={{ mt: 1 }}
          helperText="Enter a unique name for the new team"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || !teamName.trim()}>
          {loading ? <CircularProgress size={20} /> : 'Create Team'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateGolfTeamDialog;
