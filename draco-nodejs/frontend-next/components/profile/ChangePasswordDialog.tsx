'use client';

import React, { useState } from 'react';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { changePassword } from '@draco/shared-api-client';
import { useApiClient } from '@/hooks/useApiClient';

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (newToken: string) => void;
}

const ChangePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(6, 'Current password must be at least 6 characters'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ChangePasswordFormValues = z.infer<typeof ChangePasswordFormSchema>;

const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const apiClient = useApiClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(ChangePasswordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    reset();
    setSubmitError(null);
    onClose();
  };

  const onSubmit = async (data: ChangePasswordFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await changePassword({
        client: apiClient,
        body: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
        throwOnError: false,
      });

      if (result.error) {
        const errorMessage = result.error.message ?? 'Failed to change password. Please try again.';
        setSubmitError(errorMessage);
        return;
      }

      reset();
      const newToken = result.data?.token;
      if (newToken) {
        onSuccess?.(newToken);
      }
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {submitError && (
              <Alert severity="error" onClose={() => setSubmitError(null)}>
                {submitError}
              </Alert>
            )}
            <TextField
              {...register('currentPassword')}
              label="Current Password"
              type="password"
              fullWidth
              error={Boolean(errors.currentPassword)}
              helperText={errors.currentPassword?.message}
              disabled={isSubmitting}
              autoComplete="current-password"
            />
            <TextField
              {...register('newPassword')}
              label="New Password"
              type="password"
              fullWidth
              error={Boolean(errors.newPassword)}
              helperText={errors.newPassword?.message}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
            <TextField
              {...register('confirmPassword')}
              label="Confirm New Password"
              type="password"
              fullWidth
              error={Boolean(errors.confirmPassword)}
              helperText={errors.confirmPassword?.message}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ChangePasswordDialog;
