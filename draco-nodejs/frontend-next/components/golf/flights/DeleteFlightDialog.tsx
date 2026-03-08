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
import type { GolfFlightWithTeamCountType } from '@draco/shared-schemas';
import { useGolfFlights } from '../../../hooks/useGolfFlights';
import { useNotifications } from '../../../hooks/useNotifications';

interface DeleteFlightDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  flight: GolfFlightWithTeamCountType | null;
  onSuccess: (flightId: string, message: string) => void;
  onError?: (error: string) => void;
}

const DeleteFlightDialog: React.FC<DeleteFlightDialogProps> = ({
  open,
  onClose,
  accountId,
  flight,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const { notification, showNotification, hideNotification } = useNotifications();

  const flightService = useGolfFlights(accountId);

  const handleClose = () => {
    hideNotification();
    onClose();
  };

  const handleDelete = async () => {
    if (!flight) return;

    setLoading(true);
    hideNotification();

    try {
      const result = await flightService.deleteFlight(flight.id);

      if (result.success) {
        onSuccess(flight.id, `Flight "${flight.name}" deleted successfully`);
        handleClose();
      } else {
        showNotification(result.error, 'error');
        onError?.(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete flight';
      showNotification(errorMessage, 'error');
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const teamCount = flight?.teamCount || 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Flight</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Are you sure you want to delete the flight <strong>&quot;{flight?.name}&quot;</strong>?
        </Typography>
        {teamCount > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            This flight has {teamCount} team{teamCount > 1 ? 's' : ''} assigned. Deleting the flight
            will unassign these teams but will not delete them.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleDelete} variant="contained" color="error" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'Delete Flight'}
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

export default DeleteFlightDialog;
