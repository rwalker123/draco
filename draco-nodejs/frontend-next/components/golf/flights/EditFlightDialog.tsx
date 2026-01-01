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
import type { GolfFlightType, GolfFlightWithTeamCountType } from '@draco/shared-schemas';
import { useGolfFlights } from '../../../hooks/useGolfFlights';

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
  const [error, setError] = useState<string | null>(null);

  const flightService = useGolfFlights(accountId);

  useEffect(() => {
    if (flight) {
      setFlightName(flight.name);
    }
  }, [flight]);

  const resetForm = useCallback(() => {
    setFlightName(flight?.name || '');
    setError(null);
  }, [flight]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!flight || !flightName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await flightService.updateFlight(flight.id, {
        name: flightName.trim(),
      });

      if (result.success) {
        onSuccess(result.data, `Flight renamed to "${result.data.name}"`);
        handleClose();
      } else {
        setError(result.error);
        onError?.(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update flight';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [flight, flightName, flightService, onSuccess, onError, handleClose]);

  const hasChanges = flight && flightName.trim() !== flight.name;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Flight</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
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
    </Dialog>
  );
};

export default EditFlightDialog;
