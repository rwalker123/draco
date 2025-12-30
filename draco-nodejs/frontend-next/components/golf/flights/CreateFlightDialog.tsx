'use client';

import React, { useState, useCallback } from 'react';
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
import type { GolfFlightType } from '@draco/shared-schemas';
import { useGolfFlights } from '../../../hooks/useGolfFlights';

interface CreateFlightDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  seasonId: string;
  leagueSeasonId: string;
  onSuccess: (flight: GolfFlightType, message: string) => void;
  onError?: (error: string) => void;
}

const CreateFlightDialog: React.FC<CreateFlightDialogProps> = ({
  open,
  onClose,
  accountId,
  seasonId,
  leagueSeasonId,
  onSuccess,
  onError,
}) => {
  const [flightName, setFlightName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flightService = useGolfFlights(accountId);

  const resetForm = useCallback(() => {
    setFlightName('');
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!flightName.trim() || !leagueSeasonId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await flightService.createFlight(seasonId, leagueSeasonId, {
        name: flightName.trim(),
      });

      if (result.success) {
        onSuccess(result.data, `Flight "${result.data.name}" created successfully`);
        handleClose();
      } else {
        setError(result.error);
        onError?.(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create flight';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [flightName, leagueSeasonId, seasonId, flightService, onSuccess, onError, handleClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Flight</DialogTitle>
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
    </Dialog>
  );
};

export default CreateFlightDialog;
