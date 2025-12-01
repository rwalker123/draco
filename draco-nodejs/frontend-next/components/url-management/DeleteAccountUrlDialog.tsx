'use client';

import React from 'react';
import { Alert } from '@mui/material';
import type { AccountUrlType } from '@draco/shared-schemas';
import { AccountUrlDeleteResult, useAccountUrlsService } from '../../hooks/useAccountUrlsService';
import ConfirmDeleteDialog from '../social/ConfirmDeleteDialog';

interface DeleteAccountUrlDialogProps {
  accountId: string;
  open: boolean;
  url: AccountUrlType | null;
  onClose: () => void;
  onSuccess?: (result: AccountUrlDeleteResult) => void;
}

const DeleteAccountUrlDialog: React.FC<DeleteAccountUrlDialogProps> = ({
  accountId,
  open,
  url,
  onClose,
  onSuccess,
}) => {
  const { removeUrl, loading, error, clearError } = useAccountUrlsService(accountId);
  const [localError, setLocalError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setLocalError(null);
      clearError();
    }
  }, [open, clearError]);

  const handleClose = React.useCallback(() => {
    onClose();
    setLocalError(null);
    clearError();
  }, [onClose, clearError]);

  const handleDelete = async () => {
    if (!url) {
      return;
    }

    try {
      const result = await removeUrl(url.id);
      onSuccess?.(result);
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete URL';
      setLocalError(message);
    }
  };

  return (
    <ConfirmDeleteDialog
      open={open}
      title="Delete URL"
      message={`Are you sure you want to delete the URL "${url?.url}"? This action cannot be undone.`}
      content={
        localError || error ? (
          <Alert
            severity="error"
            sx={{ mt: 2 }}
            onClose={() => {
              setLocalError(null);
              clearError();
            }}
          >
            {localError ?? error}
          </Alert>
        ) : null
      }
      onConfirm={handleDelete}
      onClose={handleClose}
      confirmLabel="Delete URL"
      confirmButtonProps={{ color: 'error', variant: 'contained', disabled: loading || !url }}
      cancelButtonProps={{ disabled: loading }}
      dialogProps={{ maxWidth: 'xs', fullWidth: true }}
    />
  );
};

export default DeleteAccountUrlDialog;
