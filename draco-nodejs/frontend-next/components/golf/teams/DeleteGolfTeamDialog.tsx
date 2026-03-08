'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Typography,
  Snackbar,
} from '@mui/material';
import type { GolfTeamType } from '@draco/shared-schemas';
import { useGolfTeams } from '../../../hooks/useGolfTeams';
import { useNotifications } from '../../../hooks/useNotifications';

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
  const { notification, showNotification, hideNotification } = useNotifications();

  const teamService = useGolfTeams(accountId);

  const handleClose = () => {
    hideNotification();
    onClose();
  };

  const handleDelete = async () => {
    if (!team || !seasonId) return;

    setLoading(true);
    hideNotification();

    try {
      const result = await teamService.deleteTeam(seasonId, team.id);

      if (result.success) {
        onSuccess(team.id, `Team "${team.name}" deleted successfully`);
        handleClose();
      } else {
        showNotification(result.error, 'error');
        onError?.(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete team';
      showNotification(errorMessage, 'error');
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Team</DialogTitle>
      <DialogContent>
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
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={hideNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={hideNotification} severity={notification?.severity} variant="filled">
          {notification?.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default DeleteGolfTeamDialog;
