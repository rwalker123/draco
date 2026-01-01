'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import type { GolfTeamType } from '@draco/shared-schemas';
import { useGolfTeams } from '../../../hooks/useGolfTeams';

interface EditGolfTeamDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  team: GolfTeamType | null;
  onSuccess: (team: GolfTeamType, message: string) => void;
  onError?: (error: string) => void;
}

const EditGolfTeamDialog: React.FC<EditGolfTeamDialogProps> = ({
  open,
  onClose,
  accountId,
  team,
  onSuccess,
  onError,
}) => {
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const teamService = useGolfTeams(accountId);

  useEffect(() => {
    if (team) {
      setTeamName(team.name);
    }
  }, [team]);

  const resetForm = useCallback(() => {
    setTeamName(team?.name ?? '');
    setError(null);
  }, [team]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!teamName.trim() || !team) return;

    setLoading(true);
    setError(null);

    try {
      const result = await teamService.updateTeam(team.id, {
        name: teamName.trim(),
      });

      if (!result.success) {
        setError(result.error);
        onError?.(result.error);
        return;
      }

      onSuccess(result.data, `Team renamed to "${result.data.name}"`);
      handleClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update team';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [teamName, team, teamService, onSuccess, onError, handleClose]);

  const hasChanges = team && teamName.trim() !== team.name;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Team</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
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
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !teamName.trim() || !hasChanges}
        >
          {loading ? <CircularProgress size={20} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditGolfTeamDialog;
