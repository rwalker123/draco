'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  CircularProgress,
  Alert,
  Typography,
  Stack,
  IconButton,
  Divider,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useGolfClosestToPin } from '../../../hooks/useGolfClosestToPin';

interface Par3Hole {
  holeNumber: number;
  par: number;
}

interface HoleFormState {
  holeNumber: number;
  contactId: string;
  distance: string;
}

interface ClosestToPinEntryDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  accountId: string;
  matchId: string;
  par3Holes: Par3Hole[];
}

interface ClosestToPinEntryFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  accountId: string;
  matchId: string;
  par3Holes: Par3Hole[];
}

function ClosestToPinEntryForm({
  onClose,
  onSuccess,
  accountId,
  matchId,
  par3Holes,
}: ClosestToPinEntryFormProps) {
  const { createEntry, loading } = useGolfClosestToPin(accountId);
  const [holeStates, setHoleStates] = useState<HoleFormState[]>(() =>
    par3Holes.map((hole) => ({
      holeNumber: hole.holeNumber,
      contactId: '',
      distance: '',
    })),
  );
  const [error, setError] = useState<string | null>(null);

  const updateHoleState = (holeNumber: number, field: keyof HoleFormState, value: string) => {
    setHoleStates((prev) =>
      prev.map((state) => (state.holeNumber === holeNumber ? { ...state, [field]: value } : state)),
    );
  };

  const handleSubmit = async () => {
    setError(null);

    const filledEntries = holeStates.filter(
      (state) => state.contactId.trim() !== '' && state.distance.trim() !== '',
    );

    if (filledEntries.length === 0) {
      setError('Enter at least one closest to pin result');
      return;
    }

    for (const entry of filledEntries) {
      const distanceValue = parseFloat(entry.distance);
      if (isNaN(distanceValue) || distanceValue < 0) {
        setError(`Invalid distance for hole ${entry.holeNumber}`);
        return;
      }
    }

    for (const entry of filledEntries) {
      const distanceValue = parseFloat(entry.distance);

      const result = await createEntry(matchId, {
        holeNumber: entry.holeNumber,
        contactId: entry.contactId,
        distance: distanceValue,
        unit: 'ft',
      });

      if (!result.success) {
        setError(result.error);
        return;
      }
    }

    onSuccess?.();
    onClose();
  };

  return (
    <>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Closest to Pin Results</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {par3Holes.length === 0 ? (
          <Typography color="text.secondary">No par 3 holes available for this match.</Typography>
        ) : (
          <Stack spacing={3} sx={{ mt: 1 }}>
            {holeStates.map((state, index) => (
              <Box key={state.holeNumber}>
                {index > 0 && <Divider sx={{ mb: 3 }} />}
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Hole {state.holeNumber}
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Contact ID"
                    value={state.contactId}
                    onChange={(e) => updateHoleState(state.holeNumber, 'contactId', e.target.value)}
                    fullWidth
                    size="small"
                    placeholder="Enter contact ID"
                  />
                  <TextField
                    label="Distance (ft)"
                    value={state.distance}
                    onChange={(e) => updateHoleState(state.holeNumber, 'distance', e.target.value)}
                    fullWidth
                    size="small"
                    type="number"
                    inputProps={{ min: 0, step: 0.1 }}
                    placeholder="Distance in feet"
                  />
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || par3Holes.length === 0}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
        >
          {loading ? 'Saving...' : 'Save Results'}
        </Button>
      </DialogActions>
    </>
  );
}

export function ClosestToPinEntryDialog({
  open,
  onClose,
  onSuccess,
  accountId,
  matchId,
  par3Holes,
}: ClosestToPinEntryDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {open && (
        <ClosestToPinEntryForm
          key={matchId}
          onClose={onClose}
          onSuccess={onSuccess}
          accountId={accountId}
          matchId={matchId}
          par3Holes={par3Holes}
        />
      )}
    </Dialog>
  );
}
