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
  GolfCourseTeeType,
  CreateGolfCourseTeeType,
  UpdateGolfCourseTeeType,
} from '@draco/shared-schemas';

const distanceValueSchema = z.coerce.number().int().min(0).max(700);
const ratingSchema = z.coerce.number().min(55).max(80);
const slopeSchema = z.coerce.number().int().min(55).max(155);

const TeeFormSchema = z.object({
  teeName: z.string().trim().min(1, 'Tee name is required').max(20),
  teeColor: z.string().trim().min(1, 'Tee color is required').max(20),
  priority: z.coerce.number().int().min(0).default(0),
  mensRating: ratingSchema,
  mensSlope: slopeSchema,
  womansRating: ratingSchema,
  womansSlope: slopeSchema,
  mensRatingFront9: ratingSchema.optional(),
  mensSlopeFront9: slopeSchema.optional(),
  womansRatingFront9: ratingSchema.optional(),
  womansSlopeFront9: slopeSchema.optional(),
  mensRatingBack9: ratingSchema.optional(),
  mensSlopeBack9: slopeSchema.optional(),
  womansRatingBack9: ratingSchema.optional(),
  womansSlopeBack9: slopeSchema.optional(),
  distances: z.array(distanceValueSchema).length(18),
});

type TeeFormValues = z.infer<typeof TeeFormSchema>;

interface TeeFormProps {
  tee?: GolfCourseTeeType | null;
  numberOfHoles: number;
  onSubmit: (data: CreateGolfCourseTeeType | UpdateGolfCourseTeeType) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  disabled?: boolean;
}

const TEE_COLORS = [
  { value: 'black', label: 'Black', bg: '#000', text: '#fff' },
  { value: 'blue', label: 'Blue', bg: '#1976d2', text: '#fff' },
  { value: 'white', label: 'White', bg: '#fff', text: '#000' },
  { value: 'gold', label: 'Gold', bg: '#FFD700', text: '#000' },
  { value: 'yellow', label: 'Yellow', bg: '#FFEB3B', text: '#000' },
  { value: 'red', label: 'Red', bg: '#d32f2f', text: '#fff' },
  { value: 'green', label: 'Green', bg: '#388e3c', text: '#fff' },
  { value: 'silver', label: 'Silver', bg: '#9e9e9e', text: '#000' },
  { value: 'purple', label: 'Purple', bg: '#9C27B0', text: '#fff' },
  { value: 'orange', label: 'Orange', bg: '#FF9800', text: '#000' },
];

const DEFAULT_DISTANCES = Array(18).fill(0);

const buildDefaultValues = (tee?: GolfCourseTeeType | null): TeeFormValues => {
  if (tee) {
    return {
      teeName: tee.teeName,
      teeColor: tee.teeColor,
      priority: tee.priority,
      mensRating: tee.mensRating,
      mensSlope: tee.mensSlope,
      womansRating: tee.womansRating,
      womansSlope: tee.womansSlope,
      mensRatingFront9: tee.mensRatingFront9,
      mensSlopeFront9: tee.mensSlopeFront9,
      womansRatingFront9: tee.womansRatingFront9,
      womansSlopeFront9: tee.womansSlopeFront9,
      mensRatingBack9: tee.mensRatingBack9,
      mensSlopeBack9: tee.mensSlopeBack9,
      womansRatingBack9: tee.womansRatingBack9,
      womansSlopeBack9: tee.womansSlopeBack9,
      distances: tee.distances,
    };
  }

  return {
    teeName: '',
    teeColor: 'white',
    priority: 0,
    mensRating: 72.0,
    mensSlope: 113,
    womansRating: 72.0,
    womansSlope: 113,
    distances: [...DEFAULT_DISTANCES],
  };
};

const TeeForm: React.FC<TeeFormProps> = ({
  tee,
  numberOfHoles,
  onSubmit,
  onCancel,
  submitLabel,
  disabled = false,
}) => {
  const isEditMode = Boolean(tee);
  const defaultSubmitLabel = isEditMode ? 'Save Changes' : 'Add Tee';

  const formResolver = useMemo(
    () =>
      zodResolver(TeeFormSchema) as Resolver<TeeFormValues, Record<string, never>, TeeFormValues>,
    [],
  );

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TeeFormValues>({
    resolver: formResolver,
    defaultValues: buildDefaultValues(tee),
  });

  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const selectedColor = useWatch({ control, name: 'teeColor' });
  const colorConfig = TEE_COLORS.find((c) => c.value === selectedColor) || TEE_COLORS[2];

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
      const message = error instanceof Error ? error.message : 'Failed to save tee';
      setSubmitError(message);
    }
  });

  const isProcessing = isSubmitting || disabled;

  const renderDistanceInputRow = (holeRange: number[]) => (
    <TableRow>
      <TableCell
        sx={{
          fontWeight: 500,
          minWidth: 80,
          bgcolor: colorConfig.bg,
          color: colorConfig.text,
        }}
      >
        Distance
      </TableCell>
      {holeRange.map((hole) => (
        <TableCell key={hole} align="center" sx={{ p: 0.5 }}>
          <Controller
            name={`distances.${hole - 1}`}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="number"
                size="small"
                inputProps={{
                  min: 0,
                  max: 700,
                  style: { textAlign: 'center', padding: '4px 8px' },
                }}
                sx={{ width: 60 }}
                error={Boolean(errors.distances?.[hole - 1])}
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
                <TableCell key={hole} align="center" sx={{ fontWeight: 600, minWidth: 60 }}>
                  {hole}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>{renderDistanceInputRow(holeRange)}</TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Box component="form" onSubmit={onFormSubmit} noValidate>
      <Stack spacing={3}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Tee Information
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Tee Name"
                fullWidth
                required
                {...register('teeName')}
                error={Boolean(errors.teeName)}
                helperText={errors.teeName?.message ?? 'e.g., "Championship", "Forward"'}
                disabled={isProcessing}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller
                name="teeColor"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={Boolean(errors.teeColor)}>
                    <InputLabel>Tee Color</InputLabel>
                    <Select
                      {...field}
                      label="Tee Color"
                      disabled={isProcessing}
                      renderValue={(value) => {
                        const color = TEE_COLORS.find((c) => c.value === value);
                        if (!color) return value;
                        return (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                bgcolor: color.bg,
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                            />
                            {color.label}
                          </Box>
                        );
                      }}
                    >
                      {TEE_COLORS.map((color) => (
                        <MenuItem key={color.value} value={color.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                bgcolor: color.bg,
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                            />
                            {color.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.teeColor && <FormHelperText>{errors.teeColor.message}</FormHelperText>}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Priority"
                type="number"
                fullWidth
                {...register('priority')}
                error={Boolean(errors.priority)}
                helperText={errors.priority?.message ?? 'Display order (lower = first)'}
                disabled={isProcessing}
              />
            </Grid>
          </Grid>
        </Box>

        <Box>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Course Rating & Slope (18 Holes)
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Men's Rating"
                type="number"
                fullWidth
                required
                inputProps={{ step: 0.1, min: 55, max: 80 }}
                {...register('mensRating')}
                error={Boolean(errors.mensRating)}
                helperText={errors.mensRating?.message}
                disabled={isProcessing}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Men's Slope"
                type="number"
                fullWidth
                required
                inputProps={{ min: 55, max: 155 }}
                {...register('mensSlope')}
                error={Boolean(errors.mensSlope)}
                helperText={errors.mensSlope?.message}
                disabled={isProcessing}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Women's Rating"
                type="number"
                fullWidth
                required
                inputProps={{ step: 0.1, min: 55, max: 80 }}
                {...register('womansRating')}
                error={Boolean(errors.womansRating)}
                helperText={errors.womansRating?.message}
                disabled={isProcessing}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Women's Slope"
                type="number"
                fullWidth
                required
                inputProps={{ min: 55, max: 155 }}
                {...register('womansSlope')}
                error={Boolean(errors.womansSlope)}
                helperText={errors.womansSlope?.message}
                disabled={isProcessing}
              />
            </Grid>
          </Grid>
        </Box>

        <Box>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            9-Hole Ratings (Optional)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter separate ratings and slopes if your league plays 9-hole rounds.
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Front 9
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Men's Rating (F9)"
                type="number"
                fullWidth
                inputProps={{ step: 0.1, min: 55, max: 80 }}
                {...register('mensRatingFront9')}
                error={Boolean(errors.mensRatingFront9)}
                helperText={errors.mensRatingFront9?.message}
                disabled={isProcessing}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Men's Slope (F9)"
                type="number"
                fullWidth
                inputProps={{ min: 55, max: 155 }}
                {...register('mensSlopeFront9')}
                error={Boolean(errors.mensSlopeFront9)}
                helperText={errors.mensSlopeFront9?.message}
                disabled={isProcessing}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Women's Rating (F9)"
                type="number"
                fullWidth
                inputProps={{ step: 0.1, min: 55, max: 80 }}
                {...register('womansRatingFront9')}
                error={Boolean(errors.womansRatingFront9)}
                helperText={errors.womansRatingFront9?.message}
                disabled={isProcessing}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Women's Slope (F9)"
                type="number"
                fullWidth
                inputProps={{ min: 55, max: 155 }}
                {...register('womansSlopeFront9')}
                error={Boolean(errors.womansSlopeFront9)}
                helperText={errors.womansSlopeFront9?.message}
                disabled={isProcessing}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, mt: 1 }}>
                Back 9
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Men's Rating (B9)"
                type="number"
                fullWidth
                inputProps={{ step: 0.1, min: 55, max: 80 }}
                {...register('mensRatingBack9')}
                error={Boolean(errors.mensRatingBack9)}
                helperText={errors.mensRatingBack9?.message}
                disabled={isProcessing}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Men's Slope (B9)"
                type="number"
                fullWidth
                inputProps={{ min: 55, max: 155 }}
                {...register('mensSlopeBack9')}
                error={Boolean(errors.mensSlopeBack9)}
                helperText={errors.mensSlopeBack9?.message}
                disabled={isProcessing}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Women's Rating (B9)"
                type="number"
                fullWidth
                inputProps={{ step: 0.1, min: 55, max: 80 }}
                {...register('womansRatingBack9')}
                error={Boolean(errors.womansRatingBack9)}
                helperText={errors.womansRatingBack9?.message}
                disabled={isProcessing}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                label="Women's Slope (B9)"
                type="number"
                fullWidth
                inputProps={{ min: 55, max: 155 }}
                {...register('womansSlopeBack9')}
                error={Boolean(errors.womansSlopeBack9)}
                helperText={errors.womansSlopeBack9?.message}
                disabled={isProcessing}
              />
            </Grid>
          </Grid>
        </Box>

        <Box>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Hole Distances (yards)
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

export default TeeForm;
