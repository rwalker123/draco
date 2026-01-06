'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Stack,
  TextField,
} from '@mui/material';
import type { CreateGolfPlayerType } from '@draco/shared-schemas';

interface CreateGolfPlayerDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGolfPlayerType) => Promise<void>;
  teamName?: string;
  showSubOption?: boolean;
}

const CreateGolfPlayerDialog: React.FC<CreateGolfPlayerDialogProps> = ({
  open,
  onClose,
  onSubmit,
  teamName,
  showSubOption = true,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [email, setEmail] = useState('');
  const [initialDifferential, setInitialDifferential] = useState<number | null>(null);
  const [isSub, setIsSub] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setFirstName('');
      setLastName('');
      setMiddleName('');
      setEmail('');
      setInitialDifferential(null);
      setIsSub(false);
      setError(null);
      setFieldErrors({});
    }
  }, [open]);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [firstName, lastName, email]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const trimmedEmail = email.trim();
      const playerData: CreateGolfPlayerType = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        middleName: middleName.trim() || undefined,
        email: trimmedEmail || undefined,
        initialDifferential,
        isSub,
      };
      await onSubmit(playerData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add player');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    firstName,
    lastName,
    middleName,
    email,
    initialDifferential,
    isSub,
    validateForm,
    onSubmit,
    onClose,
  ]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  const isValid = firstName.trim() && lastName.trim();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Player{teamName ? ` to ${teamName}` : ''}</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth error={!!fieldErrors.firstName}>
              <FormLabel htmlFor="player-firstName" required>
                First Name
              </FormLabel>
              <TextField
                id="player-firstName"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                error={!!fieldErrors.firstName}
                helperText={fieldErrors.firstName}
                disabled={isSubmitting}
                size="small"
                fullWidth
                autoFocus
              />
            </FormControl>

            <FormControl fullWidth>
              <FormLabel htmlFor="player-middleName">Middle Name</FormLabel>
              <TextField
                id="player-middleName"
                placeholder="Middle name (optional)"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                disabled={isSubmitting}
                size="small"
                fullWidth
              />
            </FormControl>

            <FormControl fullWidth error={!!fieldErrors.lastName}>
              <FormLabel htmlFor="player-lastName" required>
                Last Name
              </FormLabel>
              <TextField
                id="player-lastName"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                error={!!fieldErrors.lastName}
                helperText={fieldErrors.lastName}
                disabled={isSubmitting}
                size="small"
                fullWidth
              />
            </FormControl>
          </Stack>

          <FormControl fullWidth error={!!fieldErrors.email}>
            <FormLabel htmlFor="player-email">Email</FormLabel>
            <TextField
              id="player-email"
              type="email"
              placeholder="player@example.com (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
              disabled={isSubmitting}
              size="small"
              fullWidth
            />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel htmlFor="player-differential">Initial Differential</FormLabel>
            <TextField
              id="player-differential"
              type="number"
              placeholder="e.g., 12.5"
              value={initialDifferential ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                setInitialDifferential(val === '' ? null : parseFloat(val));
              }}
              helperText="Used for initial handicap calculations"
              disabled={isSubmitting}
              size="small"
              fullWidth
              inputProps={{ step: 0.1 }}
            />
          </FormControl>

          {showSubOption && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={isSub}
                  onChange={(e) => setIsSub(e.target.checked)}
                  disabled={isSubmitting}
                />
              }
              label="Register as substitute player"
            />
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting || !isValid}>
          {isSubmitting ? <CircularProgress size={20} /> : 'Add Player'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateGolfPlayerDialog;
