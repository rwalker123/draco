'use client';

import React from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import type { AccountUrlType } from '@draco/shared-schemas';
import { AccountUrlDeleteResult, useAccountUrlsService } from '../../hooks/useAccountUrlsService';

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
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete URL</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete the URL &quot;{url?.url}&quot;? This action cannot be
          undone.
        </Typography>
        {(localError || error) && (
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
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleDelete} color="error" variant="contained" disabled={loading || !url}>
          Delete URL
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteAccountUrlDialog;
