'use client';

import React from 'react';
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
import {
  SponsorType,
  CreateSponsorSchema,
  SPONSOR_DESCRIPTION_MAX_LENGTH,
} from '@draco/shared-schemas';
import {
  SponsorFormValues,
  SponsorScope,
  useSponsorOperations,
} from '../../hooks/useSponsorOperations';
import { z } from 'zod';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatPhoneInput, isValidPhoneNumber } from '../../utils/phoneNumber';

interface SponsorFormDialogProps {
  open: boolean;
  onClose: () => void;
  context: SponsorScope;
  mode: 'create' | 'edit';
  initialSponsor?: SponsorType | null;
  onSuccess?: (result: { sponsor: SponsorType; message: string }) => void;
  onError?: (message: string) => void;
}

const SponsorFormSchema = CreateSponsorSchema.extend({
  photo: z.any().nullable().optional(),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .refine((value) => isValidPhoneNumber(value), {
      message: 'Phone number must be a valid 10-digit US phone number',
    }),
  fax: z
    .string()
    .trim()
    .max(20)
    .optional()
    .refine((value) => isValidPhoneNumber(value), {
      message: 'Fax number must be a valid 10-digit US phone number',
    }),
});

type SponsorFormSchemaType = z.infer<typeof SponsorFormSchema>;

const defaultValues: SponsorFormSchemaType = {
  name: '',
  streetAddress: '',
  cityStateZip: '',
  description: '',
  email: '',
  phone: '',
  fax: '',
  website: '',
  photo: null,
};

const SponsorFormDialog: React.FC<SponsorFormDialogProps> = ({
  open,
  onClose,
  context,
  mode,
  initialSponsor,
  onSuccess,
  onError,
}) => {
  const { createSponsor, updateSponsor, clearError, loading, error } =
    useSponsorOperations(context);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SponsorFormSchemaType>({
    resolver: zodResolver(SponsorFormSchema),
    defaultValues,
  });

  const photoValue = useWatch({ control, name: 'photo' }) as File | null | undefined;
  const sponsorName = useWatch({ control, name: 'name' });
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const handlePreviewError = () => {
    setPreviewUrl(null);
  };

  React.useEffect(() => {
    if (!open) {
      reset(defaultValues);
      setLocalError(null);
      setPreviewUrl(null);
      return;
    }

    if (mode === 'edit' && initialSponsor) {
      reset({
        name: initialSponsor.name,
        streetAddress: initialSponsor.streetAddress ?? '',
        cityStateZip: initialSponsor.cityStateZip ?? '',
        description: initialSponsor.description ?? '',
        email: initialSponsor.email ?? '',
        phone: initialSponsor.phone ?? '',
        fax: initialSponsor.fax ?? '',
        website: initialSponsor.website ?? '',
        photo: null,
      });
    } else {
      reset(defaultValues);
    }
    setLocalError(null);
  }, [open, mode, initialSponsor, reset]);

  React.useEffect(() => {
    if (photoValue instanceof File) {
      const objectUrl = URL.createObjectURL(photoValue);
      setPreviewUrl(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }

    setPreviewUrl(initialSponsor?.photoUrl ?? null);
    return undefined;
  }, [photoValue, initialSponsor]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files.length > 0 ? event.target.files[0] : null;
    setValue('photo', file, { shouldDirty: true, shouldValidate: false });
    // reset value so selecting the same file again triggers change
    if (event.target) {
      event.target.value = '';
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      setLocalError(null);
      clearError();

      const payload: SponsorFormValues = {
        ...values,
        photo: (values.photo as File | null | undefined) ?? null,
      };

      const sponsor =
        mode === 'create'
          ? await createSponsor(payload)
          : await updateSponsor(initialSponsor!.id, payload);

      onSuccess?.({
        sponsor,
        message:
          mode === 'create' ? 'Sponsor created successfully' : 'Sponsor updated successfully',
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save sponsor';
      setLocalError(message);
      onError?.(message);
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{mode === 'create' ? 'Add Sponsor' : 'Edit Sponsor'}</DialogTitle>
      <Box component="form" onSubmit={onSubmit} noValidate>
        <DialogContent>
          <Stack spacing={2}>
            {(localError || error) && (
              <Alert
                severity="error"
                onClose={() => {
                  setLocalError(null);
                  clearError();
                }}
              >
                {localError || error}
              </Alert>
            )}
            <TextField
              label="Name"
              {...register('name')}
              required
              fullWidth
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
            />
            <TextField
              label="Street Address"
              {...register('streetAddress')}
              fullWidth
              error={Boolean(errors.streetAddress)}
              helperText={errors.streetAddress?.message}
            />
            <TextField
              label="City, State, ZIP"
              {...register('cityStateZip')}
              fullWidth
              error={Boolean(errors.cityStateZip)}
              helperText={errors.cityStateZip?.message}
            />
            <TextField
              label="Description"
              {...register('description')}
              fullWidth
              multiline
              minRows={3}
              inputProps={{ maxLength: SPONSOR_DESCRIPTION_MAX_LENGTH }}
              error={Boolean(errors.description)}
              helperText={errors.description?.message}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Email"
                {...register('email')}
                type="email"
                fullWidth
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
              />
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Phone"
                    fullWidth
                    value={field.value ?? ''}
                    onChange={(event) => field.onChange(formatPhoneInput(event.target.value))}
                    onBlur={field.onBlur}
                    error={Boolean(errors.phone)}
                    helperText={errors.phone?.message}
                  />
                )}
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="fax"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Fax"
                    fullWidth
                    value={field.value ?? ''}
                    onChange={(event) => field.onChange(formatPhoneInput(event.target.value))}
                    onBlur={field.onBlur}
                    error={Boolean(errors.fax)}
                    helperText={errors.fax?.message}
                  />
                )}
              />
              <TextField
                label="Website"
                {...register('website')}
                fullWidth
                error={Boolean(errors.website)}
                helperText={errors.website?.message}
              />
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button variant="outlined" component="label">
                {photoValue ? 'Change Logo' : 'Upload Logo'}
                <input hidden type="file" accept="image/*" onChange={handlePhotoChange} />
              </Button>
              {previewUrl ? (
                <Box
                  component="img"
                  src={previewUrl}
                  alt={`${sponsorName || initialSponsor?.name || 'Sponsor'} logo preview`}
                  onError={handlePreviewError}
                  sx={{
                    width: 64,
                    height: 64,
                    objectFit: 'cover',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                />
              ) : (
                <Typography variant="caption" color="text.secondary">
                  No logo available
                </Typography>
              )}
            </Stack>
            {mode === 'edit' && initialSponsor?.photoUrl && !photoValue && (
              <Typography variant="caption" color="text.secondary">
                Current logo will be retained unless a new file is uploaded.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading || isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading || isSubmitting}>
            {loading || isSubmitting ? (
              <CircularProgress size={20} />
            ) : mode === 'create' ? (
              'Create Sponsor'
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default SponsorFormDialog;
