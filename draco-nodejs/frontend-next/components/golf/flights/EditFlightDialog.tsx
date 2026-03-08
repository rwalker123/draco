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
import type { GolfFlightType, GolfFlightWithTeamCountType } from '@draco/shared-schemas';
import { useGolfFlights } from '../../../hooks/useGolfFlights';
import { useNotifications } from '../../../hooks/useNotifications';

interface EditFlightDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  flight: GolfFlightWithTeamCountType | null;
  onSuccess: (flight: GolfFlightType, message: string) => void;
  onError?: (error: string) => void;
}

const EditFlightDialog: React.FC<EditFlightDialogProps> = ({
  open,
  onClose,
  accountId,
  flight,
  onSuccess,
  onError,
}) => {
  const [flightName, setFlightName] = useState('');
  const [loading, setLoading] = useState(false);
  const { notification, showNotification, hideNotification } = useNotifications();

  const flightService = useGolfFlights(accountId);

  useEffect(() => {
    if (flight) {
      setFlightName(flight.name);
    }
  }, [flight]);

  const resetForm = () => {
    setFlightName(flight?.name || '');
    hideNotification();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!flight || !flightName.trim()) return;

    setLoading(true);
    hideNotification();

    try {
      const result = await flightService.updateFlight(flight.id, {
        name: flightName.trim(),
      });

      if (result.success) {
        onSuccess(result.data, `Flight renamed to "${result.data.name}"`);
        handleClose();
      } else {
        showNotification(result.error, 'error');
        onError?.(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update flight';
      showNotification(errorMessage, 'error');
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = flight && flightName.trim() !== flight.name;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Flight</DialogTitle>
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
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !flightName.trim() || !hasChanges}
        >
          {loading ? <CircularProgress size={20} /> : 'Save Changes'}
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

export default EditFlightDialog;
