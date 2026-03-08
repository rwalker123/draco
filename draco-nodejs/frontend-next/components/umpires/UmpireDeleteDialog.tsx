'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Snackbar, Typography } from '@mui/material';
import type { UmpireType } from '@draco/shared-schemas';
import { useNotifications } from '../../hooks/useNotifications';
import { useUmpireService } from '../../hooks/useUmpireService';
import ConfirmDeleteDialog from '../social/ConfirmDeleteDialog';

interface UmpireDeleteDialogProps {
  accountId: string;
  open: boolean;
  umpire: UmpireType | null;
  onClose: () => void;
  onSuccess?: (result: { message: string; umpire: UmpireType }) => void;
  onError?: (message: string) => void;
}

export const UmpireDeleteDialog: React.FC<UmpireDeleteDialogProps> = ({
  accountId,
  open,
  umpire,
  onClose,
  onSuccess,
  onError,
}) => {
  const { deleteUmpire } = useUmpireService(accountId);
  const { notification, showNotification, hideNotification } = useNotifications();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      hideNotification();
    }
  }, [open, hideNotification]);

  const handleDelete = async () => {
    if (!umpire) {
      return;
    }

    setLoading(true);
    hideNotification();

    try {
      const result = await deleteUmpire(umpire.id);

      if (result.success) {
        onSuccess?.({ message: result.message, umpire: result.data });
        onClose();
      } else {
        showNotification(result.error, 'error');
        onError?.(result.error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete umpire';
      showNotification(message, 'error');
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) {
      return;
    }
    hideNotification();
    onClose();
  };

  return (
    <>
      <ConfirmDeleteDialog
        open={open}
        title="Delete Umpire"
        message={`Are you sure you want to delete ${umpire ? `${umpire.firstName} ${umpire.lastName}`.trim() : 'this umpire'}?`}
        content={
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Removing an umpire will unassign them from future scheduling options. This action cannot
            be undone.
          </Typography>
        }
        onConfirm={handleDelete}
        onClose={handleClose}
        confirmLabel={loading ? 'Deleting…' : 'Delete Umpire'}
        confirmButtonProps={{ disabled: loading }}
        cancelButtonProps={{ color: 'inherit', disabled: loading }}
        dialogProps={{ maxWidth: 'sm', fullWidth: true }}
        dialogContentProps={{ dividers: true }}
      />
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={hideNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={hideNotification} severity={notification?.severity} variant="filled">
          {notification?.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default UmpireDeleteDialog;
