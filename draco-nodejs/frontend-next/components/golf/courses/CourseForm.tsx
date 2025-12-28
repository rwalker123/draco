'use client';

import React, { useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useForm, Controller, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type {
  GolfCourseWithTeesType,
  CreateGolfCourseType,
  UpdateGolfCourseType,
} from '@draco/shared-schemas';

const parValueSchema = z.coerce.number().int().min(3).max(6);
const handicapValueSchema = z.coerce.number().int().min(1).max(18);

const CourseFormSchema = z.object({
  name: z.string().trim().min(1, 'Course name is required').max(100),
  designer: z.string().trim().max(50).optional().nullable(),
  yearBuilt: z.coerce.number().int().min(1800).max(new Date().getFullYear()).optional().nullable(),
  numberOfHoles: z.coerce.number().int().min(9).max(18),
  address: z.string().trim().max(50).optional().nullable(),
  city: z.string().trim().max(50).optional().nullable(),
  state: z.string().trim().max(50).optional().nullable(),
  zip: z.string().trim().max(20).optional().nullable(),
  country: z.string().trim().max(30).optional().nullable(),
  mensPar: z.array(parValueSchema).length(18),
  womansPar: z.array(parValueSchema).length(18),
  mensHandicap: z.array(handicapValueSchema).length(18),
  womansHandicap: z.array(handicapValueSchema).length(18),
});

type CourseFormValues = z.infer<typeof CourseFormSchema>;

interface CourseFormProps {
  course?: GolfCourseWithTeesType | null;
  onSubmit: (data: CreateGolfCourseType | UpdateGolfCourseType) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  disabled?: boolean;
}

const DEFAULT_PAR = Array(18).fill(4);
const DEFAULT_HANDICAP = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

const buildDefaultValues = (course?: GolfCourseWithTeesType | null): CourseFormValues => {
  if (course) {
    return {
      name: course.name,
      designer: course.designer ?? null,
      yearBuilt: course.yearBuilt ?? null,
      numberOfHoles: course.numberOfHoles,
      address: course.address ?? null,
      city: course.city ?? null,
      state: course.state ?? null,
      zip: course.zip ?? null,
      country: course.country ?? null,
      mensPar: course.mensPar,
      womansPar: course.womansPar,
      mensHandicap: course.mensHandicap,
      womansHandicap: course.womansHandicap,
    };
  }

  return {
    name: '',
    designer: null,
    yearBuilt: null,
    numberOfHoles: 18,
    address: null,
    city: null,
    state: null,
    zip: null,
    country: null,
    mensPar: [...DEFAULT_PAR],
    womansPar: [...DEFAULT_PAR],
    mensHandicap: [...DEFAULT_HANDICAP],
    womansHandicap: [...DEFAULT_HANDICAP],
  };
};

const CourseForm: React.FC<CourseFormProps> = ({
  course,
  onSubmit,
  onCancel,
  submitLabel,
  disabled = false,
}) => {
  const isEditMode = Boolean(course);
  const defaultSubmitLabel = isEditMode ? 'Save Changes' : 'Create Course';

  const formResolver = useMemo(
    () =>
      zodResolver(CourseFormSchema) as Resolver<
        CourseFormValues,
        Record<string, never>,
        CourseFormValues
      >,
    [],
  );

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormValues>({
    resolver: formResolver,
    defaultValues: buildDefaultValues(course),
  });

  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const numberOfHoles = useWatch({ control, name: 'numberOfHoles' });

  const holes = useMemo(() => {
    return Array.from({ length: numberOfHoles }, (_, i) => i + 1);
  }, [numberOfHoles]);

  const frontNineHoles = useMemo(() => holes.slice(0, 9), [holes]);
  const backNineHoles = useMemo(() => holes.slice(9, 18), [holes]);

  const onFormSubmit = handleSubmit(async (data) => {
    setSubmitError(null);
    try {
      await onSubmit(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save course';
      setSubmitError(message);
    }
  });

  const isProcessing = isSubmitting || disabled;

  const renderHoleInputRow = (
    label: string,
    fieldName: 'mensPar' | 'womansPar' | 'mensHandicap' | 'womansHandicap',
    holeRange: number[],
  ) => (
    <TableRow>
      <TableCell sx={{ fontWeight: 500, minWidth: 100 }}>{label}</TableCell>
      {holeRange.map((hole) => (
        <TableCell key={hole} align="center" sx={{ p: 0.5 }}>
          <Controller
            name={`${fieldName}.${hole - 1}`}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="number"
                size="small"
                inputProps={{
                  min: fieldName.includes('Par') ? 3 : 1,
                  max: fieldName.includes('Par') ? 6 : 18,
                  style: { textAlign: 'center', padding: '4px 8px' },
                }}
                sx={{ width: 50 }}
                error={Boolean(errors[fieldName]?.[hole - 1])}
                disabled={isProcessing}
              />
            )}
          />
        </TableCell>
      ))}
    </TableRow>
  );

  const renderNineHolesTable = (label: string, holeRange: number[]) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        {label}
      </Typography>
      <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 600 }}>Hole</TableCell>
              {holeRange.map((hole) => (
                <TableCell key={hole} align="center" sx={{ fontWeight: 600, minWidth: 50 }}>
                  {hole}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {renderHoleInputRow('Par (Men)', 'mensPar', holeRange)}
            {renderHoleInputRow('Par (Women)', 'womansPar', holeRange)}
            {renderHoleInputRow('Hdcp (Men)', 'mensHandicap', holeRange)}
            {renderHoleInputRow('Hdcp (Women)', 'womansHandicap', holeRange)}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Box component="form" onSubmit={onFormSubmit} noValidate>
      <Stack spacing={3}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Course Information
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Course Name"
                fullWidth
                required
                {...register('name')}
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
                disabled={isProcessing}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Controller
                name="numberOfHoles"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={Boolean(errors.numberOfHoles)}>
                    <InputLabel>Holes</InputLabel>
                    <Select {...field} label="Holes" disabled={isProcessing}>
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
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                label="Year Built"
                type="number"
                fullWidth
                {...register('yearBuilt')}
                error={Boolean(errors.yearBuilt)}
                helperText={errors.yearBuilt?.message}
                disabled={isProcessing}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Designer"
                fullWidth
                {...register('designer')}
                error={Boolean(errors.designer)}
                helperText={errors.designer?.message}
                disabled={isProcessing}
              />
            </Grid>
          </Grid>
        </Box>

        <Box>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Location
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Address"
                fullWidth
                {...register('address')}
                error={Boolean(errors.address)}
                helperText={errors.address?.message}
                disabled={isProcessing}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="City"
                fullWidth
                {...register('city')}
                error={Boolean(errors.city)}
                helperText={errors.city?.message}
                disabled={isProcessing}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="State / Province"
                fullWidth
                {...register('state')}
                error={Boolean(errors.state)}
                helperText={errors.state?.message}
                disabled={isProcessing}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="ZIP / Postal Code"
                fullWidth
                {...register('zip')}
                error={Boolean(errors.zip)}
                helperText={errors.zip?.message}
                disabled={isProcessing}
              />
            </Grid>
          </Grid>
        </Box>

        <Box>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Par & Handicap by Hole
          </Typography>
          <Box sx={{ overflowX: 'auto' }}>
            {renderNineHolesTable('Front 9', frontNineHoles)}
            {numberOfHoles > 9 && renderNineHolesTable('Back 9', backNineHoles)}
          </Box>
        </Box>

        {submitError && (
          <Alert severity="error" onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isProcessing}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {submitLabel ?? defaultSubmitLabel}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default CourseForm;
