'use client';

import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { changeLoginEmail } from '@draco/shared-api-client';
import { useApiClient } from '@/hooks/useApiClient';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationSnackbar from '../common/NotificationSnackbar';

interface ChangeLoginEmailDialogProps {
  open: boolean;
  currentLoginEmail?: string;
  onClose: () => void;
  onSuccess?: (newToken: string) => void;
}

const ChangeLoginEmailFormSchema = z
  .object({
    currentPassword: z.string().min(6, 'Current password must be at least 6 characters'),
    newLoginEmail: z.email('Enter a valid email').max(256),
    confirmNewLoginEmail: z.email('Enter a valid email').max(256),
  })
  .refine(
    (data) =>
      data.newLoginEmail.trim().toLowerCase() === data.confirmNewLoginEmail.trim().toLowerCase(),
    {
      message: 'Email addresses do not match',
      path: ['confirmNewLoginEmail'],
    },
  );

type ChangeLoginEmailFormValues = z.infer<typeof ChangeLoginEmailFormSchema>;

const ChangeLoginEmailDialog: React.FC<ChangeLoginEmailDialogProps> = ({
  open,
  currentLoginEmail,
  onClose,
  onSuccess,
}) => {
  const apiClient = useApiClient();
  const { notification, showNotification, hideNotification } = useNotifications();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangeLoginEmailFormValues>({
    resolver: zodResolver(ChangeLoginEmailFormSchema),
    defaultValues: {
      currentPassword: '',
      newLoginEmail: '',
      confirmNewLoginEmail: '',
    },
  });

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    reset();
    hideNotification();
    onClose();
  };

  const onSubmit = async (data: ChangeLoginEmailFormValues) => {
    setIsSubmitting(true);
    hideNotification();

    try {
      const result = await changeLoginEmail({
        client: apiClient,
        body: {
          currentPassword: data.currentPassword,
          newLoginEmail: data.newLoginEmail.trim(),
        },
        throwOnError: false,
      });

      if (result.error) {
        const status = result.response?.status;
        let errorMessage: string;
        if (status === 401) {
          errorMessage = 'Current password is incorrect.';
        } else if (status === 409) {
          errorMessage = 'That email is already in use as a login.';
        } else {
          errorMessage = result.error.message ?? 'Failed to change login email. Please try again.';
        }
        showNotification(errorMessage, 'error');
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
      showNotification(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Change Login Email</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <DialogContentText>
              {currentLoginEmail
                ? `You currently sign in with ${currentLoginEmail}. Changing this will affect how you log in next time.`
                : 'Changing this will affect how you log in next time.'}
            </DialogContentText>
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
              {...register('newLoginEmail')}
              label="New Login Email"
              type="email"
              fullWidth
              error={Boolean(errors.newLoginEmail)}
              helperText={errors.newLoginEmail?.message}
              disabled={isSubmitting}
              autoComplete="email"
            />
            <TextField
              {...register('confirmNewLoginEmail')}
              label="Confirm New Login Email"
              type="email"
              fullWidth
              error={Boolean(errors.confirmNewLoginEmail)}
              helperText={errors.confirmNewLoginEmail?.message}
              disabled={isSubmitting}
              autoComplete="email"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Changing...' : 'Change Login Email'}
          </Button>
        </DialogActions>
      </form>
      <NotificationSnackbar notification={notification} onClose={hideNotification} />
    </Dialog>
  );
};

export default ChangeLoginEmailDialog;
