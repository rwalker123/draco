'use client';

import React, { useCallback, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CreateGolfCourseType } from '@draco/shared-schemas';

const DEFAULT_PAR = Array(18).fill(4) as number[];
const DEFAULT_HANDICAP = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

interface CreateCourseFormValues {
  name: string;
  numberOfHoles: number;
  designer: string | null;
  yearBuilt: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

const CreateCourseSchema = z.object({
  name: z.string().trim().min(1, 'Course name is required').max(100),
  numberOfHoles: z.number().int().min(9).max(18),
  designer: z.string().trim().max(50).nullable(),
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear()).nullable(),
  address: z.string().trim().max(50).nullable(),
  city: z.string().trim().max(50).nullable(),
  state: z.string().trim().max(50).nullable(),
  zip: z.string().trim().max(20).nullable(),
});

interface CreateCourseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGolfCourseType) => Promise<void>;
}

const CreateCourseDialog: React.FC<CreateCourseDialogProps> = ({ open, onClose, onSubmit }) => {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCourseFormValues>({
    resolver: zodResolver(CreateCourseSchema),
    defaultValues: {
      name: '',
      numberOfHoles: 18,
      designer: null,
      yearBuilt: null,
      address: null,
      city: null,
      state: null,
      zip: null,
    },
  });

  const handleClose = useCallback(() => {
    reset();
    setSubmitError(null);
    onClose();
  }, [onClose, reset]);

  const onFormSubmit = handleSubmit(async (data: CreateCourseFormValues) => {
    setSubmitError(null);
    try {
      const courseData: CreateGolfCourseType = {
        name: data.name,
        numberOfHoles: data.numberOfHoles,
        designer: data.designer,
        yearBuilt: data.yearBuilt,
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zip,
        mensPar: [...DEFAULT_PAR],
        womansPar: [...DEFAULT_PAR],
        mensHandicap: [...DEFAULT_HANDICAP],
        womansHandicap: [...DEFAULT_HANDICAP],
      };
      await onSubmit(courseData);
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create course';
      setSubmitError(message);
    }
  });

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={onFormSubmit}>
        <DialogTitle>Create Golf Course</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  label="Course Name"
                  fullWidth
                  required
                  {...register('name')}
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="numberOfHoles"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={Boolean(errors.numberOfHoles)}>
                      <InputLabel>Holes</InputLabel>
                      <Select {...field} label="Holes" disabled={isSubmitting}>
                        <MenuItem value={9}>9 Holes</MenuItem>
                        <MenuItem value={18}>18 Holes</MenuItem>
                      </Select>
                      {errors.numberOfHoles && (
                        <FormHelperText>{errors.numberOfHoles.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Designer"
                  fullWidth
                  {...register('designer')}
                  error={Boolean(errors.designer)}
                  helperText={errors.designer?.message}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="yearBuilt"
                  control={control}
                  render={({ field: { onChange, value, ...field } }) => (
                    <TextField
                      {...field}
                      label="Year Built"
                      type="number"
                      fullWidth
                      value={value ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        onChange(val === '' ? null : parseInt(val, 10));
                      }}
                      error={Boolean(errors.yearBuilt)}
                      helperText={errors.yearBuilt?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Address"
                  fullWidth
                  {...register('address')}
                  error={Boolean(errors.address)}
                  helperText={errors.address?.message}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="City"
                  fullWidth
                  {...register('city')}
                  error={Boolean(errors.city)}
                  helperText={errors.city?.message}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="State / Province"
                  fullWidth
                  {...register('state')}
                  error={Boolean(errors.state)}
                  helperText={errors.state?.message}
                  disabled={isSubmitting}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="ZIP / Postal Code"
                  fullWidth
                  {...register('zip')}
                  error={Boolean(errors.zip)}
                  helperText={errors.zip?.message}
                  disabled={isSubmitting}
                />
              </Grid>
            </Grid>

            {submitError && (
              <Alert severity="error" onClose={() => setSubmitError(null)}>
                {submitError}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            Create Course
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateCourseDialog;
