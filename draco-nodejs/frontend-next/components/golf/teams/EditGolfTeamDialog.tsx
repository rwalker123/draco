'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import type { GolfTeamType, GolfTeamWithPlayerCountType } from '@draco/shared-schemas';
import { useGolfTeams } from '../../../hooks/useGolfTeams';
import { useNotifications } from '../../../hooks/useNotifications';

interface EditGolfTeamDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  seasonId: string;
  team: GolfTeamType | null;
  onSuccess: (team: GolfTeamWithPlayerCountType, message: string) => void;
  onError?: (error: string) => void;
}

const EditGolfTeamDialog: React.FC<EditGolfTeamDialogProps> = ({
  open,
  onClose,
  accountId,
  seasonId,
  team,
  onSuccess,
  onError,
}) => {
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const { notification, showNotification, hideNotification } = useNotifications();

  const teamService = useGolfTeams(accountId);

  useEffect(() => {
    if (team) {
      setTeamName(team.name);
    }
  }, [team]);

  const resetForm = () => {
    setTeamName(team?.name ?? '');
    hideNotification();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!teamName.trim() || !team || !seasonId) return;

    setLoading(true);
    hideNotification();

    try {
      const result = await teamService.updateTeam(seasonId, team.id, {
        name: teamName.trim(),
      });

      if (!result.success) {
        showNotification(result.error, 'error');
        onError?.(result.error);
        return;
      }

      onSuccess(result.data, `Team renamed to "${result.data.name}"`);
      handleClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update team';
      showNotification(errorMessage, 'error');
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = team && teamName.trim() !== team.name;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Team</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Team Name"
          fullWidth
          variant="outlined"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && hasChanges && !loading) {
              void handleSubmit();
            }
          }}
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

export default EditGolfTeamDialog;
