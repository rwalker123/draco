'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { listAccountFields } from '@draco/shared-api-client';
import type { WorkoutType, UpsertWorkoutType } from '@draco/shared-schemas';
import { useAuth } from '../../../context/AuthContext';
import { useApiClient } from '../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../utils/apiResult';
import RichTextEditor from '../../email/RichTextEditor';
import { createWorkout, getWorkout, updateWorkout } from '../../../services/workoutService';

interface WorkoutFormDialogProps {
  accountId: string;
  open: boolean;
  mode: 'create' | 'edit';
  workoutId?: string | null;
  onClose: () => void;
  onSuccess?: (result: { workout: WorkoutType; message: string }) => void;
  onError?: (message: string) => void;
}

interface FieldOption {
  id: string;
  name: string;
}

const preprocessDate = (message: string) =>
  z.preprocess((value) => {
    if (value instanceof Date) {
      return value;
    }

    if (!value) {
      return undefined;
    }

    const parsed = new Date(value as string);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }, z.date(message));

const WorkoutFormSchema = z.object({
  workoutDesc: z.string().trim().min(1, 'Workout title is required').max(255),
  workoutDate: preprocessDate('Workout date is required'),
  fieldId: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Field must be a valid selection')
    .nullable()
    .optional(),
  comments: z.string().trim().max(2000, 'Comments cannot exceed 2000 characters').optional(),
});

type WorkoutFormValues = z.infer<typeof WorkoutFormSchema>;

const getDefaultValues = (): WorkoutFormValues => ({
  workoutDesc: '',
  workoutDate: new Date(),
  fieldId: null,
  comments: '',
});

export const WorkoutFormDialog: React.FC<WorkoutFormDialogProps> = ({
  accountId,
  open,
  mode,
  workoutId,
  onClose,
  onSuccess,
  onError,
}) => {
  const { token } = useAuth();
  const apiClient = useApiClient();
  const [fields, setFields] = useState<FieldOption[]>([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(0);

  const formResolver = useMemo(
    () =>
      zodResolver(WorkoutFormSchema) as Resolver<
        WorkoutFormValues,
        Record<string, never>,
        WorkoutFormValues
      >,
    [],
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WorkoutFormValues>({
    resolver: formResolver,
    defaultValues: getDefaultValues(),
  });

  const dialogTitle = useMemo(
    () => (mode === 'create' ? 'Create Workout' : 'Edit Workout'),
    [mode],
  );

  const dialogActionLabel = useMemo(
    () => (mode === 'create' ? 'Create Workout' : 'Update Workout'),
    [mode],
  );

  const commentsValue = watch('comments');

  const loadFields = useCallback(async () => {
    const result = await listAccountFields({
      client: apiClient,
      path: { accountId },
      throwOnError: false,
    });

    const data = unwrapApiResult(result, 'Failed to load fields');
    return (data.fields ?? []).map((field) => ({
      id: field.id,
      name: field.name ?? field.shortName,
    }));
  }, [accountId, apiClient]);

  const initializeDialog = useCallback(async () => {
    setInitialLoading(true);
    setSubmitError(null);

    try {
      const [fieldOptions, workoutDetails] = await Promise.all([
        loadFields(),
        mode === 'edit' && workoutId
          ? getWorkout(accountId, workoutId, token ?? undefined)
          : Promise.resolve(null),
      ]);

      setFields(fieldOptions);

      if (mode === 'edit' && workoutDetails) {
        reset({
          workoutDesc: workoutDetails.workoutDesc,
          workoutDate: new Date(workoutDetails.workoutDate),
          fieldId: workoutDetails.field?.id ?? null,
          comments: workoutDetails.comments ?? '',
        });
        setEditorKey((value) => value + 1);
      } else {
        reset(getDefaultValues());
        setEditorKey((value) => value + 1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load workout data';
      setSubmitError(message);
      onError?.(message);
    } finally {
      setInitialLoading(false);
    }
  }, [accountId, loadFields, mode, onError, reset, token, workoutId]);

  useEffect(() => {
    if (!open) {
      reset(getDefaultValues());
      setSubmitError(null);
      return;
    }

    void initializeDialog();
  }, [initializeDialog, open, reset]);

  const handleClose = useCallback(() => {
    if (isSubmitting) {
      return;
    }
    onClose();
  }, [isSubmitting, onClose]);

  const onSubmit = handleSubmit(async (values) => {
    if (mode === 'edit' && !workoutId) {
      const message = 'Workout identifier is missing';
      setSubmitError(message);
      onError?.(message);
      return;
    }

    try {
      setSubmitError(null);

      const trimmedComments = (values.comments ?? '').trim();
      const payload: UpsertWorkoutType = {
        workoutDesc: values.workoutDesc.trim(),
        workoutDate: values.workoutDate.toISOString(),
        fieldId: values.fieldId ?? null,
      };

      if (trimmedComments.length > 0) {
        payload.comments = trimmedComments;
      } else {
        payload.comments = '';
      }

      const workout =
        mode === 'create'
          ? await createWorkout(accountId, payload, token ?? undefined)
          : await updateWorkout(accountId, workoutId as string, payload, token ?? undefined);

      onSuccess?.({
        workout,
        message:
          mode === 'create' ? 'Workout created successfully' : 'Workout updated successfully',
      });

      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save workout';
      setSubmitError(message);
      onError?.(message);
    }
  });

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>{dialogTitle}</DialogTitle>
      <Box component="form" onSubmit={onSubmit} noValidate>
        <DialogContent dividers>
          {submitError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          ) : null}

          {initialLoading ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 6,
              }}
            >
              <CircularProgress />
              <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
                Preparing workout form...
              </Typography>
            </Box>
          ) : (
            <Stack spacing={3}>
              <TextField
                {...register('workoutDesc')}
                label="Workout Title"
                fullWidth
                required
                error={Boolean(errors.workoutDesc)}
                helperText={errors.workoutDesc?.message}
              />

              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Controller
                  control={control}
                  name="workoutDate"
                  render={({ field }) => (
                    <FormControl fullWidth error={Boolean(errors.workoutDate)}>
                      <DateTimePicker
                        label="Workout Date & Time"
                        value={field.value ?? null}
                        onChange={(newValue) => {
                          field.onChange(newValue ?? undefined);
                        }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                          },
                        }}
                      />
                      {errors.workoutDate ? (
                        <FormHelperText>{errors.workoutDate.message}</FormHelperText>
                      ) : null}
                    </FormControl>
                  )}
                />
              </LocalizationProvider>

              <Controller
                control={control}
                name="fieldId"
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Field (Optional)</InputLabel>
                    <Select
                      label="Field (Optional)"
                      value={field.value ?? ''}
                      onChange={(event) => {
                        const nextValue = event.target.value === '' ? null : event.target.value;
                        field.onChange(nextValue);
                      }}
                    >
                      <MenuItem value="">
                        <em>No field selected</em>
                      </MenuItem>
                      {fields.map((fieldOption) => (
                        <MenuItem key={fieldOption.id} value={fieldOption.id}>
                          {fieldOption.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.fieldId ? (
                      <FormHelperText error>{errors.fieldId.message}</FormHelperText>
                    ) : null}
                  </FormControl>
                )}
              />

              <Box>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <RichTextEditor
                  key={editorKey}
                  initialValue={commentsValue ?? ''}
                  placeholder="Enter workout description..."
                  error={Boolean(errors.comments)}
                  onChange={(html) => {
                    setValue('comments', html, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    });
                  }}
                  minHeight={240}
                />
                {errors.comments ? (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    {errors.comments.message}
                  </Typography>
                ) : null}
              </Box>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} color="inherit" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting || initialLoading}>
            {isSubmitting ? 'Saving...' : dialogActionLabel}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};
