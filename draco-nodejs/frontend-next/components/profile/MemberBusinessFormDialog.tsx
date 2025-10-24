'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CreateMemberBusinessSchema,
  MEMBER_BUSINESS_DESCRIPTION_MAX_LENGTH,
  type CreateMemberBusinessType,
  type MemberBusinessType,
} from '@draco/shared-schemas';
import { createMemberBusiness, updateMemberBusiness } from '@draco/shared-api-client';
import { useApiClient } from '@/hooks/useApiClient';
import { unwrapApiResult } from '@/utils/apiResult';
import { formatPhoneInput } from '@/utils/phoneNumber';

export type MemberBusinessDialogResult = {
  message: string;
  memberBusiness: MemberBusinessType;
};

type MemberBusinessFormValues = z.infer<typeof CreateMemberBusinessSchema>;

interface MemberBusinessFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  accountId: string | null;
  contactId: string | null;
  memberBusiness?: MemberBusinessType | null;
  onClose: () => void;
  onSuccess?: (result: MemberBusinessDialogResult) => void;
  onError?: (message: string) => void;
}

const buildDefaultValues = (
  contactId: string | null,
  business?: MemberBusinessType | null,
): MemberBusinessFormValues => ({
  contactId: business?.contactId ?? contactId ?? '',
  name: business?.name ?? '',
  streetAddress: business?.streetAddress ?? '',
  cityStateZip: business?.cityStateZip ?? '',
  description: business?.description ?? '',
  email: business?.email ?? '',
  phone: business?.phone ?? '',
  fax: business?.fax ?? '',
  website: business?.website ?? '',
});

const MemberBusinessFormDialog: React.FC<MemberBusinessFormDialogProps> = ({
  open,
  mode,
  accountId,
  contactId,
  memberBusiness,
  onClose,
  onSuccess,
  onError,
}) => {
  const apiClient = useApiClient();
  const defaultValues = useMemo(
    () => buildDefaultValues(contactId, memberBusiness),
    [contactId, memberBusiness],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<MemberBusinessFormValues>({
    resolver: zodResolver(CreateMemberBusinessSchema),
    defaultValues,
  });

  const descriptionValue = watch('description') ?? '';

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    reset(defaultValues);
    setSubmitError(null);
  }, [open, defaultValues, reset]);

  const handleDialogError = (message: string) => {
    setSubmitError(message);
    onError?.(message);
  };

  const onSubmit = async (values: MemberBusinessFormValues) => {
    if (!accountId) {
      handleDialogError('Account not available.');
      return;
    }

    if (mode === 'create' && !contactId) {
      handleDialogError('Contact information is required to create a member business.');
      return;
    }

    const payload: CreateMemberBusinessType = {
      ...values,
      contactId: values.contactId || contactId || '',
    };

    try {
      setSubmitting(true);
      setSubmitError(null);

      if (mode === 'create') {
        const result = await createMemberBusiness({
          client: apiClient,
          path: { accountId },
          body: payload,
          security: [{ type: 'http', scheme: 'bearer' }],
          throwOnError: false,
        });

        const data = unwrapApiResult(result, 'Failed to create member business');
        if (data) {
          onSuccess?.({
            message: 'Member business added successfully.',
            memberBusiness: data,
          });
        }
      } else if (memberBusiness) {
        const result = await updateMemberBusiness({
          client: apiClient,
          path: { accountId, memberBusinessId: memberBusiness.id },
          body: payload,
          security: [{ type: 'http', scheme: 'bearer' }],
          throwOnError: false,
        });

        const data = unwrapApiResult(result, 'Failed to update member business');
        if (data) {
          onSuccess?.({
            message: 'Member business updated successfully.',
            memberBusiness: data,
          });
        }
      }

      onClose();
    } catch (error) {
      console.error('Failed to submit member business form', error);
      handleDialogError('Unable to save the member business right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const dialogTitle = mode === 'create' ? 'Add Member Business' : 'Edit Member Business';

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {submitError && <Alert severity="error">{submitError}</Alert>}

          <input type="hidden" {...register('contactId')} />

          <TextField
            label="Business Name"
            fullWidth
            autoFocus
            {...register('name')}
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
          />
          <TextField
            label="Street Address"
            fullWidth
            {...register('streetAddress')}
            error={Boolean(errors.streetAddress)}
            helperText={errors.streetAddress?.message}
          />
          <TextField
            label="City, State ZIP"
            fullWidth
            {...register('cityStateZip')}
            error={Boolean(errors.cityStateZip)}
            helperText={errors.cityStateZip?.message}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            minRows={3}
            {...register('description')}
            error={Boolean(errors.description)}
            helperText={
              errors.description?.message ??
              `${descriptionValue.length}/${MEMBER_BUSINESS_DESCRIPTION_MAX_LENGTH} characters`
            }
            inputProps={{ maxLength: MEMBER_BUSINESS_DESCRIPTION_MAX_LENGTH }}
          />
          <TextField
            label="Email"
            type="email"
            fullWidth
            {...register('email')}
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="phone"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  label="Phone"
                  fullWidth
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(formatPhoneInput(event.target.value))}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="fax"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  label="Fax"
                  fullWidth
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(formatPhoneInput(event.target.value))}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Stack>
          <TextField
            label="Website"
            fullWidth
            {...register('website')}
            error={Boolean(errors.website)}
            helperText={errors.website?.message}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={submitting || !accountId || (mode === 'create' && !contactId)}
        >
          {mode === 'create' ? 'Add Business' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MemberBusinessFormDialog;
