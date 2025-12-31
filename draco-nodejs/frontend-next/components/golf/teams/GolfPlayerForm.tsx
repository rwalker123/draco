'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateGolfPlayerSchema } from '@draco/shared-schemas';
import type { GolfRosterEntryType, CreateGolfPlayerType } from '@draco/shared-schemas';
import { z } from 'zod';

type CreateGolfPlayerFormValues = z.input<typeof CreateGolfPlayerSchema>;

interface GolfPlayerFormProps {
  player?: GolfRosterEntryType;
  onSubmit: (data: CreateGolfPlayerType) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  disabled?: boolean;
  showSubOption?: boolean;
}

const GolfPlayerForm: React.FC<GolfPlayerFormProps> = ({
  player,
  onSubmit,
  onCancel,
  submitLabel,
  disabled = false,
  showSubOption = true,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!player;
  const defaultSubmitLabel = isEditMode ? 'Save Changes' : 'Add Player';

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CreateGolfPlayerFormValues>({
    resolver: zodResolver(CreateGolfPlayerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      email: '',
      initialDifferential: null,
      isSub: false,
    },
  });

  useEffect(() => {
    if (player) {
      reset({
        firstName: player.player.firstName,
        lastName: player.player.lastName,
        middleName: player.player.middleName || '',
        email: '',
        initialDifferential: player.initialDifferential ?? null,
        isSub: false,
      });
    } else {
      reset({
        firstName: '',
        lastName: '',
        middleName: '',
        email: '',
        initialDifferential: null,
        isSub: false,
      });
    }
  }, [player, reset]);

  const handleFormSubmit = useCallback(
    async (data: CreateGolfPlayerFormValues) => {
      setError(null);
      setIsSubmitting(true);
      try {
        const validatedData = CreateGolfPlayerSchema.parse(data);
        await onSubmit(validatedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save player');
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit],
  );

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <Stack spacing={3}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box>
          <Typography variant="h6" gutterBottom>
            Player Information
          </Typography>

          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth error={!!errors.firstName}>
                <FormLabel htmlFor="player-firstName" required>
                  First Name
                </FormLabel>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="player-firstName"
                      placeholder="First name"
                      error={!!errors.firstName}
                      helperText={errors.firstName?.message}
                      disabled={disabled || isSubmitting}
                      size="small"
                      fullWidth
                      autoFocus
                    />
                  )}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel htmlFor="player-middleName">Middle Name</FormLabel>
                <Controller
                  name="middleName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="player-middleName"
                      placeholder="Middle name (optional)"
                      disabled={disabled || isSubmitting}
                      size="small"
                      fullWidth
                    />
                  )}
                />
              </FormControl>

              <FormControl fullWidth error={!!errors.lastName}>
                <FormLabel htmlFor="player-lastName" required>
                  Last Name
                </FormLabel>
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="player-lastName"
                      placeholder="Last name"
                      error={!!errors.lastName}
                      helperText={errors.lastName?.message}
                      disabled={disabled || isSubmitting}
                      size="small"
                      fullWidth
                    />
                  )}
                />
              </FormControl>
            </Stack>

            <FormControl fullWidth error={!!errors.email}>
              <FormLabel htmlFor="player-email">Email</FormLabel>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="player-email"
                    type="email"
                    placeholder="player@example.com (optional)"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    disabled={disabled || isSubmitting}
                    size="small"
                    fullWidth
                  />
                )}
              />
            </FormControl>

            <FormControl fullWidth error={!!errors.initialDifferential}>
              <FormLabel htmlFor="player-differential">Initial Differential</FormLabel>
              <Controller
                name="initialDifferential"
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <TextField
                    {...field}
                    id="player-differential"
                    type="number"
                    placeholder="e.g., 12.5"
                    value={value ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      onChange(val === '' ? null : parseFloat(val));
                    }}
                    error={!!errors.initialDifferential}
                    helperText={
                      errors.initialDifferential?.message ||
                      'Used for initial handicap calculations'
                    }
                    disabled={disabled || isSubmitting}
                    size="small"
                    fullWidth
                    inputProps={{ step: 0.1 }}
                  />
                )}
              />
            </FormControl>

            {showSubOption && (
              <Controller
                name="isSub"
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={value}
                        onChange={(e) => onChange(e.target.checked)}
                        disabled={disabled || isSubmitting}
                      />
                    }
                    label="Register as substitute player"
                  />
                )}
              />
            )}
          </Stack>
        </Box>

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={onCancel} disabled={disabled || isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={disabled || isSubmitting || (!isDirty && isEditMode)}
          >
            {submitLabel || defaultSubmitLabel}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default GolfPlayerForm;
