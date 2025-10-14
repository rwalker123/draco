'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { FieldType, UpsertFieldType } from '@draco/shared-schemas';
import { UpsertFieldSchema } from '@draco/shared-schemas';
import type { FieldLocationMapProps } from './FieldLocationMap';
import { useFieldService, type FieldService } from '../../hooks/useFieldService';

interface FieldFormDialogProps {
  accountId: string;
  open: boolean;
  mode: 'create' | 'edit';
  field?: FieldType | null;
  onClose: () => void;
  onSuccess?: (result: { message: string; field: FieldType }) => void;
  onError?: (message: string) => void;
}

type FieldFormValues = UpsertFieldType;

const DEFAULT_VALUES: FieldFormValues = {
  name: '',
  shortName: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  comment: '',
  directions: '',
  rainoutNumber: '',
  latitude: '',
  longitude: '',
};

const FieldLocationMap = dynamic<FieldLocationMapProps>(
  () => import('./FieldLocationMap').then((module) => module.FieldLocationMap),
  {
    ssr: false,
    loading: () => (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 320,
        }}
      >
        <CircularProgress size={32} />
      </Box>
    ),
  },
);

const parseCoordinate = (value: string | null | undefined): number | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const numeric = Number.parseFloat(trimmed);

  return Number.isNaN(numeric) ? null : numeric;
};

export const FieldFormDialog: React.FC<FieldFormDialogProps> = ({
  accountId,
  open,
  mode,
  field,
  onClose,
  onSuccess,
  onError,
}) => {
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { createField, updateField } = useFieldService(accountId);

  const initialValues = useMemo<FieldFormValues>(() => {
    if (!field) {
      return DEFAULT_VALUES;
    }

    return {
      name: field.name ?? '',
      shortName: field.shortName ?? field.name?.slice(0, 5) ?? '',
      address: field.address ?? '',
      city: field.city ?? '',
      state: field.state ?? '',
      zip: field.zip ?? '',
      comment: field.comment ?? '',
      directions: field.directions ?? '',
      rainoutNumber: field.rainoutNumber ?? '',
      latitude: field.latitude ?? '',
      longitude: field.longitude ?? '',
    };
  }, [field]);

  const formResolver = useMemo(
    () =>
      zodResolver(UpsertFieldSchema) as Resolver<
        FieldFormValues,
        Record<string, never>,
        FieldFormValues
      >,
    [],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FieldFormValues>({
    resolver: formResolver,
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset(initialValues);
      setSubmitError(null);
      setGeocodeError(null);
    }
  }, [open, initialValues, reset]);

  const latitudeValue = watch('latitude');
  const longitudeValue = watch('longitude');
  const latitude = parseCoordinate(latitudeValue);
  const longitude = parseCoordinate(longitudeValue);

  const handleLocateAddress = useCallback(async () => {
    const { address, city, state, zip } = getValues();
    const components = [address, city, state, zip].filter(
      (part): part is string => typeof part === 'string' && part.trim().length > 0,
    );

    if (components.length === 0) {
      setGeocodeError('Enter an address, city, state, or zip code to locate the field.');
      return;
    }

    setGeocodeLoading(true);
    setGeocodeError(null);

    try {
      const query = encodeURIComponent(components.join(', '));
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`,
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data: Array<{ lat: string; lon: string }> = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        setGeocodeError('No matching locations were found for that address.');
        return;
      }

      const { lat, lon } = data[0];
      const nextLatitude = Number.parseFloat(lat);
      const nextLongitude = Number.parseFloat(lon);

      if (Number.isNaN(nextLatitude) || Number.isNaN(nextLongitude)) {
        setGeocodeError('Unable to determine coordinates for that address.');
        return;
      }

      setValue('latitude', nextLatitude.toFixed(6));
      setValue('longitude', nextLongitude.toFixed(6));
      await trigger(['latitude', 'longitude']);
      setGeocodeError(null);
    } catch (error) {
      console.error('Failed to locate address', error);
      setGeocodeError('Unable to locate that address. Please adjust and try again.');
    } finally {
      setGeocodeLoading(false);
    }
  }, [getValues, setValue, trigger]);

  const handleMapLocationChange = useCallback(
    (lat: number, lng: number) => {
      setValue('latitude', lat.toFixed(6));
      setValue('longitude', lng.toFixed(6));
      void trigger(['latitude', 'longitude']);
    },
    [setValue, trigger],
  );

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      if (mode === 'edit' && !field?.id) {
        const missingMessage = 'Field information is missing';
        setSubmitError(missingMessage);
        onError?.(missingMessage);
        return;
      }

      let action: Awaited<ReturnType<FieldService['createField']>>;

      if (mode === 'create') {
        action = await createField(values);
      } else {
        action = await updateField(field!.id, values);
      }

      if (action.success) {
        const { message, data } = action;
        onSuccess?.({ message, field: data });
        onClose();
      } else {
        const errorMessage = action.error;
        setSubmitError(errorMessage);
        onError?.(errorMessage);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save field';
      setSubmitError(message);
      onError?.(message);
    }
  });

  const dialogTitle = mode === 'create' ? 'Create Field' : 'Edit Field';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {submitError ? <Alert severity="error">{submitError}</Alert> : null}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Field Name"
                fullWidth
                required
                autoFocus
                {...register('name')}
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Short Name"
                fullWidth
                required
                inputProps={{ maxLength: 5 }}
                {...register('shortName')}
                error={Boolean(errors.shortName)}
                helperText={
                  errors.shortName?.message ?? 'Displayed in compact schedules (max 5 characters).'
                }
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Address"
                fullWidth
                {...register('address')}
                error={Boolean(errors.address)}
                helperText={errors.address?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="City"
                fullWidth
                {...register('city')}
                error={Boolean(errors.city)}
                helperText={errors.city?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="State"
                fullWidth
                {...register('state')}
                error={Boolean(errors.state)}
                helperText={errors.state?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Zip Code"
                fullWidth
                {...register('zip')}
                error={Boolean(errors.zip)}
                helperText={errors.zip?.message}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Directions"
                fullWidth
                multiline
                minRows={2}
                {...register('directions')}
                error={Boolean(errors.directions)}
                helperText={errors.directions?.message}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Comments"
                fullWidth
                multiline
                minRows={2}
                {...register('comment')}
                error={Boolean(errors.comment)}
                helperText={errors.comment?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Rainout Number"
                fullWidth
                {...register('rainoutNumber')}
                error={Boolean(errors.rainoutNumber)}
                helperText={errors.rainoutNumber?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Latitude"
                fullWidth
                {...register('latitude')}
                error={Boolean(errors.latitude)}
                helperText={errors.latitude?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Longitude"
                fullWidth
                {...register('longitude')}
                error={Boolean(errors.longitude)}
                helperText={errors.longitude?.message}
              />
            </Grid>
          </Grid>

          <Box>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle1">Field Location</Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={handleLocateAddress}
                disabled={geocodeLoading}
              >
                {geocodeLoading ? 'Locating…' : 'Locate by Address'}
              </Button>
            </Stack>
            {geocodeError ? <Alert severity="warning">{geocodeError}</Alert> : null}
            <FieldLocationMap
              latitude={latitude}
              longitude={longitude}
              onLocationChange={handleMapLocationChange}
            />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {mode === 'create' ? 'Create Field' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FieldFormDialog;
