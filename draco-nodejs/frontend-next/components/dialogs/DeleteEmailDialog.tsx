'use client';

import React, { useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import NotificationSnackbar from '../common/NotificationSnackbar';
import { deleteAccountEmail } from '@draco/shared-api-client';
import { useApiClient } from '../../hooks/useApiClient';
import { useNotifications } from '../../hooks/useNotifications';
import type { EmailRecord } from '../../types/emails/email';
import { assertNoApiError } from '../../utils/apiResult';
import ConfirmDeleteDialog from '../social/ConfirmDeleteDialog';

interface DeleteEmailDialogProps {
  open: boolean;
  accountId: string;
  email: EmailRecord | null;
  onClose: () => void;
  onDeleted?: (emailId: string) => void;
  onError?: (error: string) => void;
}

const DeleteEmailDialog: React.FC<DeleteEmailDialogProps> = ({
  open,
  accountId,
  email,
  onClose,
  onDeleted,
  onError,
}) => {
  const apiClient = useApiClient();
  const { notification, showNotification, hideNotification } = useNotifications();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      hideNotification();
      setLoading(false);
    }
  }, [open, hideNotification]);

  const handleDelete = async () => {
    if (!email) {
      return;
    }

    try {
      setLoading(true);
      hideNotification();
      const result = await deleteAccountEmail({
        client: apiClient,
        path: { accountId, emailId: email.id },
        throwOnError: false,
      });

      assertNoApiError(result, 'Failed to delete email.');
      onDeleted?.(email.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete email:', err);
      const message = 'Unable to delete email. Please try again.';
      showNotification(message, 'error');
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (loading) {
      return;
    }
    onClose();
  };

  return (
    <>
      <ConfirmDeleteDialog
        open={open && Boolean(email)}
        title="Delete Email"
        message={`Are you sure you want to delete "${email?.subject ?? 'this email'}"? This action cannot be undone.`}
        onClose={handleCancel}
        onConfirm={handleDelete}
        confirmLabel={loading ? 'Deleting...' : 'Delete'}
        confirmButtonProps={{
          color: 'error',
          variant: 'contained',
          disabled: loading || !email,
          startIcon: loading ? <CircularProgress size={18} color="inherit" /> : undefined,
        }}
        cancelButtonProps={{ disabled: loading }}
        dialogProps={{ maxWidth: 'xs', fullWidth: true }}
      />
      <NotificationSnackbar notification={notification} onClose={hideNotification} />
    </>
  );
};

export default DeleteEmailDialog;
