'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Typography } from '@mui/material';
import type { UmpireType } from '@draco/shared-schemas';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
    }
  }, [open]);

  const handleDelete = async () => {
    if (!umpire) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await deleteUmpire(umpire.id);

      if (result.success) {
        onSuccess?.({ message: result.message, umpire: result.data });
        onClose();
      } else {
        setError(result.error);
        onError?.(result.error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete umpire';
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) {
      return;
    }
    onClose();
  };

  return (
    <ConfirmDeleteDialog
      open={open}
      title="Delete Umpire"
      message={`Are you sure you want to delete ${umpire?.displayName ?? 'this umpire'}?`}
      content={
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Removing an umpire will unassign them from future scheduling options. This action cannot
            be undone.
          </Typography>
          {error ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          ) : null}
        </>
      }
      onConfirm={handleDelete}
      onClose={handleClose}
      confirmLabel={loading ? 'Deleting…' : 'Delete Umpire'}
      confirmButtonProps={{ disabled: loading }}
      cancelButtonProps={{ color: 'inherit', disabled: loading }}
      dialogProps={{ maxWidth: 'sm', fullWidth: true }}
      dialogContentProps={{ dividers: true }}
    />
  );
};

export default UmpireDeleteDialog;
