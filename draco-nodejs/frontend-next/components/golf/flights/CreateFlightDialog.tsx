'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import NotificationSnackbar from '../../common/NotificationSnackbar';
import type { GolfFlightType } from '@draco/shared-schemas';
import { useGolfFlights } from '../../../hooks/useGolfFlights';
import { useNotifications } from '../../../hooks/useNotifications';

interface CreateFlightDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  seasonId: string;
  onSuccess: (flight: GolfFlightType, message: string) => void;
  onError?: (error: string) => void;
}

const CreateFlightDialog: React.FC<CreateFlightDialogProps> = ({
  open,
  onClose,
  accountId,
  seasonId,
  onSuccess,
  onError,
}) => {
  const [flightName, setFlightName] = useState('');
  const [loading, setLoading] = useState(false);
  const { notification, showNotification, hideNotification } = useNotifications();

  const flightService = useGolfFlights(accountId);

  const resetForm = () => {
    setFlightName('');
    hideNotification();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!flightName.trim()) return;

    setLoading(true);
    hideNotification();

    try {
      const result = await flightService.createFlight(seasonId, {
        name: flightName.trim(),
      });

      if (result.success) {
        onSuccess(result.data, `Flight "${result.data.name}" created successfully`);
        handleClose();
      } else {
        showNotification(result.error, 'error');
        onError?.(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create flight';
      showNotification(errorMessage, 'error');
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Flight</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Flight Name"
          fullWidth
          variant="outlined"
          value={flightName}
          onChange={(e) => setFlightName(e.target.value)}
          disabled={loading}
          sx={{ mt: 1 }}
          placeholder="e.g., Championship Flight, A Flight, B Flight"
          helperText="Enter a name for the new flight"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || !flightName.trim()}>
          {loading ? <CircularProgress size={20} /> : 'Create Flight'}
        </Button>
      </DialogActions>
      <NotificationSnackbar notification={notification} onClose={hideNotification} />
    </Dialog>
  );
};

export default CreateFlightDialog;
