'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Box,
  Button,
  FormControl,
  FormLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateGolfTeamSchema } from '@draco/shared-schemas';
import type { GolfTeamType, CreateGolfTeamType } from '@draco/shared-schemas';

interface GolfTeamFormProps {
  team?: GolfTeamType;
  onSubmit: (data: CreateGolfTeamType) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  disabled?: boolean;
}

const GolfTeamForm: React.FC<GolfTeamFormProps> = ({
  team,
  onSubmit,
  onCancel,
  submitLabel,
  disabled = false,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!team;
  const defaultSubmitLabel = isEditMode ? 'Save Changes' : 'Create Team';

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CreateGolfTeamType>({
    resolver: zodResolver(CreateGolfTeamSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (team) {
      reset({
        name: team.name,
      });
    } else {
      reset({
        name: '',
      });
    }
  }, [team, reset]);

  const handleFormSubmit = useCallback(
    async (data: CreateGolfTeamType) => {
      setError(null);
      setIsSubmitting(true);
      try {
        await onSubmit(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save team');
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
            Team Information
          </Typography>

          <FormControl fullWidth error={!!errors.name}>
            <FormLabel htmlFor="team-name" required>
              Team Name
            </FormLabel>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="team-name"
                  placeholder="Enter team name"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  disabled={disabled || isSubmitting}
                  size="small"
                  fullWidth
                  autoFocus
                />
              )}
            />
          </FormControl>
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

export default GolfTeamForm;
