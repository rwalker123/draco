'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  Switch,
  MenuItem,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  UpsertWorkoutRegistrationType,
  WorkoutRegistrationType,
  WorkoutSourcesType,
} from '@draco/shared-schemas';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createWorkoutRegistration, getSources } from '../../services/workoutService';
import { formatPhoneInput } from '../../utils/phoneNumber';
import { getApiErrorMessage } from '../../utils/apiResult';

interface WorkoutRegistrationFormProps {
  accountId: string;
  workoutId: string;
  registration?: WorkoutRegistrationType | null;
  token?: string;
  actionLayout?: 'page' | 'dialog';
  onSubmit?: (data: UpsertWorkoutRegistrationType) => Promise<WorkoutRegistrationType | void>;
  onSuccess?: (result: { message: string; registration?: WorkoutRegistrationType }) => void;
  onError?: (message: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
  closeOnSuccess?: boolean;
  formId?: string;
  onDirtyChange?: (isDirty: boolean) => void;
  onRemove?: () => void;
  removeDisabled?: boolean;
}

type FormValues = {
  name: string;
  email: string;
  age: string;
  phone1?: string;
  phone2?: string;
  phone3?: string;
  phone4?: string;
  positions: string;
  isManager: boolean;
  whereHeard: string;
};

const formSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Valid email is required'),
  age: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Age must be a number')
    .refine((val) => parseInt(val, 10) > 0, 'Age must be greater than 0'),
  phone1: z.string().trim().max(50).optional(),
  phone2: z.string().trim().max(50).optional(),
  phone3: z.string().trim().max(50).optional(),
  phone4: z.string().trim().max(50).optional(),
  positions: z.string().trim().min(1, 'Positions are required'),
  isManager: z.boolean(),
  whereHeard: z.string().trim().min(1, 'Where heard is required'),
});

export const WorkoutRegistrationForm: React.FC<WorkoutRegistrationFormProps> = ({
  accountId,
  workoutId,
  registration,
  token,
  actionLayout = 'page',
  onSubmit,
  onSuccess,
  onError,
  onCancel,
  isLoading = false,
  closeOnSuccess,
  formId,
  onDirtyChange,
  onRemove,
  removeDisabled,
}) => {
  const [sources, setSources] = useState<WorkoutSourcesType>({ options: [] });
  const [loadingSources, setLoadingSources] = useState(false);

  const isEditMode = !!registration;
  const shouldAutoClose = closeOnSuccess ?? !isEditMode;

  const formResolver = useMemo(() => zodResolver<FormValues, unknown, FormValues>(formSchema), []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    setValue,
    watch,
    setError,
    clearErrors,
  } = useForm<FormValues>({
    resolver: formResolver,
    defaultValues: {
      name: '',
      email: '',
      age: '',
      phone1: '',
      phone2: '',
      phone3: '',
      phone4: '',
      positions: '',
      isManager: false,
      whereHeard: '',
    },
  });

  useEffect(() => {
    if (registration) {
      reset({
        name: registration.name,
        email: registration.email,
        age: registration.age.toString(),
        phone1: registration.phone1 || '',
        phone2: registration.phone2 || '',
        phone3: registration.phone3 || '',
        phone4: registration.phone4 || '',
        positions: registration.positions,
        isManager: registration.isManager,
        whereHeard: registration.whereHeard,
      });
    } else {
      reset();
    }
  }, [registration, reset]);

  useEffect(() => {
    const fetchSources = async () => {
      try {
        setLoadingSources(true);
        const sourcesData = await getSources(accountId);
        setSources(sourcesData);
      } catch (err) {
        console.error('Error fetching sources:', err);
        setError('root', { type: 'manual', message: 'Failed to load "where heard" options' });
      } finally {
        setLoadingSources(false);
      }
    };

    fetchSources();
  }, [accountId, setError]);

  const handlePhoneChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const formattedValue = formatPhoneInput(event.target.value);
      setValue('phone1', formattedValue, { shouldDirty: true });
    },
    [setValue],
  );

  const onSubmitHandler = handleSubmit(async (data) => {
    clearErrors('root');

    const successMessage = isEditMode
      ? 'Registration updated.'
      : 'Registration submitted. Check your email for your access code.';
    const defaultError = isEditMode
      ? 'Failed to update registration'
      : 'Failed to submit registration';

    const payload: UpsertWorkoutRegistrationType = {
      name: data.name.trim(),
      email: data.email.trim(),
      age: parseInt(data.age, 10),
      phone1: data.phone1?.trim() ?? '',
      phone2: data.phone2?.trim() ?? '',
      phone3: data.phone3?.trim() ?? '',
      phone4: data.phone4?.trim() ?? '',
      positions: data.positions.trim(),
      isManager: data.isManager,
      whereHeard: data.whereHeard.trim(),
    };

    try {
      const submitFn =
        onSubmit ??
        (async (payloadData: UpsertWorkoutRegistrationType) =>
          createWorkoutRegistration(accountId, workoutId, payloadData, token));

      const result = (await submitFn(payload)) as WorkoutRegistrationType | void;

      onSuccess?.({ message: successMessage, registration: result ?? undefined });
      if (shouldAutoClose) {
        onCancel();
      }
    } catch (submitError) {
      const message = getApiErrorMessage(submitError, defaultError);
      setError('root', { type: 'manual', message });
      onError?.(message);
    }
  });

  const isBusy = isLoading || isSubmitting;
  const watchIsManager = watch('isManager');
  const watchWhereHeard = watch('whereHeard') ?? '';
  const watchAge = watch('age') ?? '';
  const watchPhone = watch('phone1') ?? '';
  const formElementId = formId || 'workout-registration-form';
  const isDialogLayout = actionLayout === 'dialog';

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);
  const rootError = errors.root?.message;

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {isEditMode ? 'Edit Registration' : 'Register for Workout'}
      </Typography>

      {rootError && (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {rootError}
        </Typography>
      )}

      <form id={formElementId} onSubmit={onSubmitHandler} noValidate>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 2,
          }}
        >
          {/* Name and Email */}
          <Box>
            <TextField
              fullWidth
              label="Name"
              {...register('name')}
              required
              disabled={isBusy}
              error={!!errors.name}
              helperText={errors.name?.message ?? ''}
            />
          </Box>
          <Box>
            <TextField
              fullWidth
              label="Email"
              type="email"
              {...register('email')}
              required
              disabled={isBusy}
              error={!!errors.email}
              helperText={errors.email?.message ?? ''}
            />
          </Box>

          {/* Age and Positions */}
          <Box>
            <TextField
              fullWidth
              label="Age"
              type="number"
              {...register('age')}
              value={watchAge}
              required
              disabled={isBusy}
              inputProps={{ min: 1, max: 100 }}
              error={!!errors.age}
              helperText={errors.age?.message ?? ''}
            />
          </Box>
          <Box>
            <TextField
              fullWidth
              label="Positions"
              {...register('positions')}
              required
              disabled={isBusy}
              placeholder="e.g., Pitcher, Outfield"
              error={!!errors.positions}
              helperText={errors.positions?.message ?? ''}
            />
          </Box>

          {/* Phone Number */}
          <Box>
            <TextField
              fullWidth
              label="Phone"
              {...register('phone1')}
              value={watchPhone}
              onChange={handlePhoneChange}
              disabled={isBusy}
              placeholder="(555) 123-4567"
              error={!!errors.phone1}
              helperText={errors.phone1?.message ?? ''}
            />
          </Box>

          {/* Where Heard */}
          <Box>
            <TextField
              fullWidth
              select
              label="Where Heard"
              {...register('whereHeard')}
              value={watchWhereHeard}
              required
              disabled={isBusy || loadingSources}
              helperText={
                errors.whereHeard?.message ??
                (loadingSources
                  ? 'Loading options...'
                  : 'Select where you heard about this workout')
              }
              error={!!errors.whereHeard}
            >
              {sources.options.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Is Manager Toggle */}
          <Box>
            <FormControl>
              <FormControlLabel
                control={
                  <Switch checked={!!watchIsManager} {...register('isManager')} disabled={isBusy} />
                }
                label="Open to Managing a Team"
              />
            </FormControl>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mt: 3,
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: isDialogLayout ? 'flex-end' : 'space-between',
          }}
        >
          {!isDialogLayout && isEditMode && (
            <Button
              variant="contained"
              color="error"
              onClick={onRemove}
              disabled={isBusy || removeDisabled}
            >
              Remove Registration
            </Button>
          )}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="outlined" onClick={onCancel} disabled={isBusy}>
              {isDialogLayout ? 'Cancel' : 'Home'}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isBusy || !isDirty}
              startIcon={isBusy ? <CircularProgress size={20} /> : null}
            >
              {isBusy
                ? 'Saving...'
                : isEditMode
                  ? 'Update Registration'
                  : isDialogLayout
                    ? 'Register'
                    : 'Add Registration'}
            </Button>
          </Box>
        </Box>
      </form>
    </Paper>
  );
};
