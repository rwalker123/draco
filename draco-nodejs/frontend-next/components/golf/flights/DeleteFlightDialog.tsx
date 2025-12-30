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
import type { GolfFlightWithTeamCountType } from '@draco/shared-schemas';
import { useGolfFlights } from '../../../hooks/useGolfFlights';

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
  const [error, setError] = useState<string | null>(null);

  const flightService = useGolfFlights(accountId);

  const handleClose = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  const handleDelete = useCallback(async () => {
    if (!flight) return;

    setLoading(true);
    setError(null);

    try {
      const result = await flightService.deleteFlight(flight.id);

      if (result.success) {
        onSuccess(flight.id, `Flight "${flight.name}" deleted successfully`);
        handleClose();
      } else {
        setError(result.error);
        onError?.(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete flight';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [flight, flightService, onSuccess, onError, handleClose]);

  const teamCount = flight?.teamCount || 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Flight</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
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
    </Dialog>
  );
};

export default DeleteFlightDialog;
