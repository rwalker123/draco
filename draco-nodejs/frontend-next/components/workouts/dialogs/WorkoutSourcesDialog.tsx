'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '../../../context/AuthContext';
import { getSources, putSources } from '../../../services/workoutService';
import { useNotifications } from '../../../hooks/useNotifications';
import type { WorkoutSourcesType } from '@draco/shared-schemas';
import ConfirmDeleteDialog from '../../social/ConfirmDeleteDialog';
import { DeleteIconButton } from '../../common/ActionIconButtons';

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
  const { notification, showNotification, hideNotification } = useNotifications();
  const [sources, setSources] = useState<WorkoutSourcesType>({ options: [] });
  const [loading, setLoading] = useState(false);
  const [newOption, setNewOption] = useState('');
  const [pendingOption, setPendingOption] = useState<string | null>(null);

  const options = sources.options ?? [];

  useEffect(() => {
    if (!open) {
      return;
    }

    setNewOption('');
    hideNotification();

    const controller = new AbortController();

    const fetchSources = async () => {
      try {
        setLoading(true);
        hideNotification();

        const data = await getSources(accountId, token ?? undefined, controller.signal);
        if (controller.signal.aborted) return;
        setSources(data ?? { options: [] });
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Error fetching workout sources:', err);
        showNotification('Failed to load sources', 'error');
        setSources({ options: FALLBACK_OPTIONS });
        onError?.('Failed to load workout sources');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void fetchSources();

    return () => {
      controller.abort();
    };
  }, [open, accountId, token, onError, hideNotification, showNotification]);

  const handleAddOption = async () => {
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
      showNotification('Where heard options updated', 'success');
      onSuccess?.('Where heard options updated');
    } catch (err) {
      console.error('Error saving workout source option:', err);
      setSources({ options });
      const message = 'Failed to save new option';
      showNotification(message, 'error');
      onError?.(message);
    }
  };

  const handleRemoveOption = async (option: string) => {
    const updated: WorkoutSourcesType = {
      options: options.filter((value) => value !== option),
    };

    setSources(updated);

    try {
      await putSources(accountId, updated, token ?? undefined);
      showNotification('Where heard options updated', 'success');
      onSuccess?.('Where heard options updated');
    } catch (err) {
      console.error('Error removing workout source option:', err);
      setSources({ options });
      const message = 'Failed to remove option';
      showNotification(message, 'error');
      onError?.(message);
    }
  };

  const handleClose = () => {
    setNewOption('');
    hideNotification();
    setPendingOption(null);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Manage Where Heard Options</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
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
                      <DeleteIconButton
                        tooltipTitle="Delete source"
                        onClick={() => setPendingOption(option)}
                        disabled={loading}
                      />
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
      <ConfirmDeleteDialog
        open={Boolean(pendingOption)}
        title="Delete Option"
        message={
          pendingOption
            ? `Are you sure you want to delete the option "${pendingOption}"?`
            : 'Are you sure you want to delete this option?'
        }
        onClose={() => setPendingOption(null)}
        onConfirm={async () => {
          if (!pendingOption) {
            return;
          }
          await handleRemoveOption(pendingOption);
          setPendingOption(null);
        }}
        confirmButtonProps={{ color: 'error', variant: 'contained', disabled: loading }}
        cancelButtonProps={{ disabled: loading }}
        dialogProps={{ maxWidth: 'xs', fullWidth: true }}
      />
    </>
  );
};
