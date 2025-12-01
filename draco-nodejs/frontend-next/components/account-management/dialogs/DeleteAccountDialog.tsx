'use client';

import React from 'react';
import { Alert, Stack } from '@mui/material';
import type { AccountType as SharedAccountType } from '@draco/shared-schemas';
import { useAccountManagementService } from '../../../hooks/useAccountManagementService';
import ConfirmDeleteDialog from '../../social/ConfirmDeleteDialog';

interface DeleteAccountDialogProps {
  open: boolean;
  account: SharedAccountType | null;
  onClose: () => void;
  onSuccess?: (result: { accountId: string; message: string }) => void;
  onError?: (message: string) => void;
}

const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({
  open,
  account,
  onClose,
  onSuccess,
  onError,
}) => {
  const { deleteAccount: deleteAccountOperation } = useAccountManagementService();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setError(null);
    }
  }, [open]);

  const handleClose = React.useCallback(() => {
    if (isDeleting) {
      return;
    }
    onClose();
  }, [isDeleting, onClose]);

  const handleDelete = React.useCallback(async () => {
    if (!account) {
      setError('Account details are missing. Please close and try again.');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteAccountOperation({
        accountId: account.id,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      onSuccess?.({
        accountId: account.id,
        message: result.message ?? `Account '${account.name}' was deleted successfully.`,
      });

      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete account';
      setError(message);
      onError?.(message);
    } finally {
      setIsDeleting(false);
    }
  }, [account, deleteAccountOperation, onClose, onSuccess, onError]);

  const accountName = account?.name ?? 'this account';

  return (
    <ConfirmDeleteDialog
      open={open}
      title="Delete Account"
      message={`Are you sure you want to delete the account '${accountName}'? This action cannot be undone.`}
      content={
        error ? (
          <Stack spacing={2}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Stack>
        ) : null
      }
      onClose={handleClose}
      onConfirm={handleDelete}
      confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
      confirmButtonProps={{
        color: 'error',
        variant: 'contained',
        disabled: isDeleting || !account,
      }}
      cancelButtonProps={{ disabled: isDeleting }}
      dialogProps={{ maxWidth: 'xs', fullWidth: true }}
    />
  );
};

export default DeleteAccountDialog;
