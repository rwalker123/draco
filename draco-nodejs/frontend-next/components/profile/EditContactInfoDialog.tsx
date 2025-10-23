'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { updateCurrentUserContact } from '@draco/shared-api-client';
import {
  ContactDetailsSchema,
  CreateContactSchema,
  type BaseContactType,
} from '@draco/shared-schemas';
import type { CreateContact } from '@draco/shared-api-client/generated';
import { useApiClient } from '@/hooks/useApiClient';
import { unwrapApiResult } from '@/utils/apiResult';
import { formatPhoneInput } from '@/utils/phoneNumber';

interface EditContactInfoDialogProps {
  open: boolean;
  contact: BaseContactType | null;
  accountId: string | null;
  onClose: () => void;
  onSuccess?: (updated: BaseContactType) => void;
}

const EditContactDetailsSchema = ContactDetailsSchema.pick({
  phone1: true,
  phone2: true,
  phone3: true,
  streetAddress: true,
  city: true,
  state: true,
  zip: true,
});

const EditContactFormSchema = z.object({
  email: CreateContactSchema.shape.email,
  contactDetails: EditContactDetailsSchema,
});

type EditContactFormValues = z.infer<typeof EditContactFormSchema>;

const EMPTY_FORM_CONTACT_DETAILS: EditContactFormValues['contactDetails'] = {
  phone1: '',
  phone2: '',
  phone3: '',
  streetAddress: '',
  city: '',
  state: '',
  zip: '',
};

const EMPTY_DETAILS = {
  phone1: '',
  phone2: '',
  phone3: '',
  streetAddress: '',
  city: '',
  state: '',
  zip: '',
  dateOfBirth: '',
};

const EditContactInfoDialog: React.FC<EditContactInfoDialogProps> = ({
  open,
  contact,
  accountId,
  onClose,
  onSuccess,
}) => {
  const apiClient = useApiClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const initialValues = useMemo<EditContactFormValues>(() => {
    if (!contact) {
      return {
        email: '',
        contactDetails: { ...EMPTY_FORM_CONTACT_DETAILS },
      };
    }

    const details = contact.contactDetails ?? EMPTY_DETAILS;

    return {
      email: contact.email ?? '',
      contactDetails: {
        phone1: details.phone1 ?? '',
        phone2: details.phone2 ?? '',
        phone3: details.phone3 ?? '',
        streetAddress: details.streetAddress ?? '',
        city: details.city ?? '',
        state: details.state ?? '',
        zip: details.zip ?? '',
      },
    };
  }, [contact]);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditContactFormValues>({
    resolver: zodResolver(EditContactFormSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    reset(initialValues);
    setSubmitError(null);
  }, [open, initialValues, reset]);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handlePhoneChange =
    (field: 'phone1' | 'phone2' | 'phone3') => (event: React.ChangeEvent<HTMLInputElement>) => {
      const formattedPhone = formatPhoneInput(event.target.value);
      setValue(`contactDetails.${field}`, formattedPhone, {
        shouldValidate: false,
        shouldDirty: true,
      });

      if (submitError) {
        setSubmitError(null);
      }
    };

  const buildPayload = (values: EditContactFormValues): CreateContact | null => {
    if (!contact) {
      return null;
    }

    const details = contact.contactDetails ?? EMPTY_DETAILS;

    const payload: CreateContact = {
      firstName: contact.firstName,
      lastName: contact.lastName,
      middleName: contact.middleName ?? undefined,
      email: values.email || undefined,
      contactDetails: {
        phone1: values.contactDetails.phone1 || null,
        phone2: values.contactDetails.phone2 || null,
        phone3: values.contactDetails.phone3 || null,
        streetAddress: values.contactDetails.streetAddress || null,
        city: values.contactDetails.city || null,
        state: values.contactDetails.state || null,
        zip: values.contactDetails.zip || null,
        dateOfBirth: details.dateOfBirth ?? null,
      },
    };

    return payload;
  };

  const onSubmit = async (values: EditContactFormValues) => {
    if (!contact || !accountId) {
      return;
    }

    setSubmitError(null);

    try {
      const payload = buildPayload(values);
      if (!payload) {
        throw new Error('Unable to prepare contact update.');
      }

      const result = await updateCurrentUserContact({
        client: apiClient,
        path: { accountId },
        body: payload,
        throwOnError: false,
      });

      const updated = unwrapApiResult(
        result,
        'Failed to update contact information.',
      ) as BaseContactType;
      onSuccess?.(updated);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update contact information.';
      setSubmitError(message);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Contact Details</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
              Name
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {contact ? `${contact.firstName} ${contact.lastName}` : '—'}
            </Typography>
          </Box>

          {submitError && <Alert severity="error">{submitError}</Alert>}

          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              autoComplete="email"
              placeholder="name@example.com"
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              {...register('email')}
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Primary Phone"
                  fullWidth
                  autoComplete="tel"
                  placeholder="(555) 123-4567"
                  error={Boolean(errors.contactDetails?.phone1)}
                  helperText={errors.contactDetails?.phone1?.message}
                  {...register('contactDetails.phone1')}
                  onChange={handlePhoneChange('phone1')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Secondary Phone"
                  fullWidth
                  autoComplete="tel"
                  placeholder="(555) 234-5678"
                  error={Boolean(errors.contactDetails?.phone2)}
                  helperText={errors.contactDetails?.phone2?.message}
                  {...register('contactDetails.phone2')}
                  onChange={handlePhoneChange('phone2')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Additional Phone"
                  fullWidth
                  autoComplete="tel"
                  placeholder="(555) 345-6789"
                  error={Boolean(errors.contactDetails?.phone3)}
                  helperText={errors.contactDetails?.phone3?.message}
                  {...register('contactDetails.phone3')}
                  onChange={handlePhoneChange('phone3')}
                />
              </Grid>
            </Grid>

            <TextField
              label="Street Address"
              fullWidth
              autoComplete="street-address"
              placeholder="123 Main St"
              error={Boolean(errors.contactDetails?.streetAddress)}
              helperText={errors.contactDetails?.streetAddress?.message}
              {...register('contactDetails.streetAddress')}
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField
                  label="City"
                  fullWidth
                  autoComplete="address-level2"
                  placeholder="City"
                  error={Boolean(errors.contactDetails?.city)}
                  helperText={errors.contactDetails?.city?.message}
                  {...register('contactDetails.city')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  label="State"
                  fullWidth
                  autoComplete="address-level1"
                  placeholder="State"
                  error={Boolean(errors.contactDetails?.state)}
                  helperText={errors.contactDetails?.state?.message}
                  {...register('contactDetails.state')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="ZIP / Postal Code"
                  fullWidth
                  autoComplete="postal-code"
                  placeholder="00000"
                  error={Boolean(errors.contactDetails?.zip)}
                  helperText={errors.contactDetails?.zip?.message}
                  {...register('contactDetails.zip')}
                />
              </Grid>
            </Grid>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting || !accountId || !contact}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditContactInfoDialog;
