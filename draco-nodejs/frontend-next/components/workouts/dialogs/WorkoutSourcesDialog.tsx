'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useAuth } from '../../../context/AuthContext';
import { getSources, putSources } from '../../../services/workoutService';
import type { WorkoutSourcesType } from '@draco/shared-schemas';

interface WorkoutSourcesDialogProps {
  accountId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const FALLBACK_OPTIONS = ['Website', 'Friend', 'Social Media', 'Other'];

export const WorkoutSourcesDialog: React.FC<WorkoutSourcesDialogProps> = ({
  accountId,
  open,
  onClose,
  onSuccess,
  onError,
}) => {
  const { token } = useAuth();
  const [sources, setSources] = useState<WorkoutSourcesType>({ options: [] });
  const [loading, setLoading] = useState(false);
  const [newOption, setNewOption] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const options = useMemo(() => sources.options ?? [], [sources.options]);

  const fetchSources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getSources(accountId, token ?? undefined);
      setSources(data ?? { options: [] });
    } catch (err) {
      console.error('Error fetching workout sources:', err);
      setError('Failed to load sources');
      setSources({ options: FALLBACK_OPTIONS });
      onError?.('Failed to load workout sources');
    } finally {
      setLoading(false);
    }
  }, [accountId, token, onError]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setNewOption('');
    setError(null);
    setSuccessMessage(null);
    void fetchSources();
  }, [open, fetchSources]);

  const handleAddOption = useCallback(async () => {
    const trimmed = newOption.trim();

    if (!trimmed || trimmed.length > 25 || options.includes(trimmed)) {
      return;
    }

    const updated: WorkoutSourcesType = {
      options: [...options, trimmed],
    };

    setSources(updated);
    setNewOption('');

    try {
      await putSources(accountId, updated, token ?? undefined);
      setSuccessMessage('Where heard options updated');
      onSuccess?.('Where heard options updated');
    } catch (err) {
      console.error('Error saving workout source option:', err);
      setSources({ options });
      const message = 'Failed to save new option';
      setError(message);
      onError?.(message);
    }
  }, [accountId, newOption, onError, onSuccess, options, token]);

  const handleRemoveOption = useCallback(
    async (option: string) => {
      const updated: WorkoutSourcesType = {
        options: options.filter((value) => value !== option),
      };

      setSources(updated);

      try {
        await putSources(accountId, updated, token ?? undefined);
        setSuccessMessage('Where heard options updated');
        onSuccess?.('Where heard options updated');
      } catch (err) {
        console.error('Error removing workout source option:', err);
        setSources({ options });
        const message = 'Failed to remove option';
        setError(message);
        onError?.(message);
      }
    },
    [accountId, onError, onSuccess, options, token],
  );

  const resetDialogState = useCallback(() => {
    setNewOption('');
    setError(null);
    setSuccessMessage(null);
  }, []);

  const handleClose = useCallback(() => {
    resetDialogState();
    onClose();
  }, [onClose, resetDialogState]);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Manage Where Heard Options</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {error ? (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          ) : null}
          {successMessage ? (
            <Alert severity="success" onClose={() => setSuccessMessage(null)}>
              {successMessage}
            </Alert>
          ) : null}

          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Add New Option
            </Typography>
            <Stack direction="row" spacing={2} alignItems="flex-end">
              <TextField
                fullWidth
                label="New Option"
                value={newOption}
                onChange={(event) => setNewOption(event.target.value)}
                inputProps={{ maxLength: 25 }}
                helperText={`${newOption.length}/25 characters`}
                disabled={loading}
              />
              <Button
                variant="contained"
                onClick={handleAddOption}
                disabled={loading || !newOption.trim() || newOption.length > 25}
              >
                Add
              </Button>
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Current Options ({options.length})
            </Typography>
            {options.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No options configured yet. Add some options above.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {options.map((option) => (
                  <Box
                    key={option}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <Typography>{option}</Typography>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveOption(option)}
                      disabled={loading}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
