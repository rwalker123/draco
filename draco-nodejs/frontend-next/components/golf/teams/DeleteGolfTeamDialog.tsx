'use client';

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import type { GolfTeamType } from '@draco/shared-schemas';
import { useGolfTeams } from '../../../hooks/useGolfTeams';

interface DeleteGolfTeamDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  seasonId: string;
  team: GolfTeamType | null;
  onSuccess: (teamId: string, message: string) => void;
  onError?: (error: string) => void;
}

const DeleteGolfTeamDialog: React.FC<DeleteGolfTeamDialogProps> = ({
  open,
  onClose,
  accountId,
  seasonId,
  team,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const teamService = useGolfTeams(accountId);

  const handleClose = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  const handleDelete = useCallback(async () => {
    if (!team || !seasonId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await teamService.deleteTeam(seasonId, team.id);

      if (result.success) {
        onSuccess(team.id, `Team "${team.name}" deleted successfully`);
        handleClose();
      } else {
        setError(result.error);
        onError?.(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete team';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [team, seasonId, teamService, onSuccess, onError, handleClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Team</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Typography variant="body1" gutterBottom>
          Are you sure you want to delete the team <strong>&quot;{team?.name}&quot;</strong>?
        </Typography>
        <Alert severity="warning" sx={{ mt: 2 }}>
          This will permanently remove the team and all associated roster entries from this season.
          This action cannot be undone.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleDelete} variant="contained" color="error" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'Delete Team'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteGolfTeamDialog;
