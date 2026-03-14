'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import { updateLeague as apiUpdateLeague } from '@draco/shared-api-client';
import type { LeagueSeasonWithDivisionTeamsAndUnassignedType } from '@draco/shared-schemas';
import { unwrapApiResult } from '../../utils/apiResult';
import { useApiClient } from '../../hooks/useApiClient';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationSnackbar from '../common/NotificationSnackbar';

interface EditLeagueDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  leagueSeason: LeagueSeasonWithDivisionTeamsAndUnassignedType | null;
  onSuccess: (leagueSeasonId: string, newName: string, message: string) => void;
  onError?: (error: string) => void;
}

const EditLeagueDialog: React.FC<EditLeagueDialogProps> = ({
  open,
  onClose,
  accountId,
  leagueSeason,
  onSuccess,
  onError,
}) => {
  const apiClient = useApiClient();
  const { notification, showNotification, hideNotification } = useNotifications();
  const [leagueName, setLeagueName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (leagueSeason) {
      setLeagueName(leagueSeason.league.name);
    }
  }, [leagueSeason]);

  const resetForm = () => {
    setLeagueName('');
    hideNotification();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!leagueSeason || !leagueName.trim()) return;

    setLoading(true);
    hideNotification();

    try {
      const result = await apiUpdateLeague({
        client: apiClient,
        path: { accountId, leagueId: leagueSeason.league.id },
        body: { name: leagueName.trim() },
        throwOnError: false,
      });

      const updated = unwrapApiResult(result, 'Failed to update league');

      if (updated) {
        onSuccess(leagueSeason.id, leagueName.trim(), 'League updated successfully');
        handleClose();
      } else {
        showNotification('Failed to update league', 'error');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update league';
      showNotification(errorMessage, 'error');
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit League</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="League Name"
          fullWidth
          variant="outlined"
          value={leagueName}
          onChange={(e) => setLeagueName(e.target.value)}
          disabled={loading}
          helperText="Enter the new name for the league"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || !leagueName.trim()}>
          {loading ? <CircularProgress size={20} /> : 'Update League'}
        </Button>
      </DialogActions>
      <NotificationSnackbar notification={notification} onClose={hideNotification} />
    </Dialog>
  );
};

export default EditLeagueDialog;
