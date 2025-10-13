'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { deleteAccountEmail } from '@draco/shared-api-client';
import { useApiClient } from '../../hooks/useApiClient';
import type { EmailRecord } from '../../types/emails/email';
import { assertNoApiError } from '../../utils/apiResult';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      setLoading(false);
    }
  }, [open]);

  const handleDelete = useCallback(async () => {
    if (!email) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
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
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  }, [accountId, apiClient, email, onClose, onDeleted, onError]);

  const handleCancel = useCallback(() => {
    if (loading) {
      return;
    }
    onClose();
  }, [loading, onClose]);

  return (
    <Dialog open={open && Boolean(email)} onClose={handleCancel} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Email</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Typography>
          Are you sure you want to delete{' '}
          <Typography component="span" sx={{ fontWeight: 600 }}>
            {email?.subject ?? 'this email'}
          </Typography>
          ? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={loading || !email}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteEmailDialog;
