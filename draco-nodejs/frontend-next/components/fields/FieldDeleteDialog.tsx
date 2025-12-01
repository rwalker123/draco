'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Typography } from '@mui/material';
import type { FieldType } from '@draco/shared-schemas';
import { useFieldService } from '../../hooks/useFieldService';
import ConfirmDeleteDialog from '../social/ConfirmDeleteDialog';

interface FieldDeleteDialogProps {
  accountId: string;
  open: boolean;
  field: FieldType | null;
  onClose: () => void;
  onSuccess?: (result: { message: string; field: FieldType }) => void;
  onError?: (message: string) => void;
}

export const FieldDeleteDialog: React.FC<FieldDeleteDialogProps> = ({
  accountId,
  open,
  field,
  onClose,
  onSuccess,
  onError,
}) => {
  const { deleteField } = useFieldService(accountId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
    }
  }, [open]);

  const handleDelete = async () => {
    if (!field) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await deleteField(field.id);

      if (result.success) {
        onSuccess?.({ message: result.message, field: result.data });
        onClose();
      } else {
        setError(result.error);
        onError?.(result.error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete field';
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
      title="Delete Field"
      message={`Are you sure you want to delete ${field?.name ?? 'this field'}?`}
      content={
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Deleting a field removes it from upcoming schedules and workouts. This action cannot be
            undone.
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
      confirmLabel={loading ? 'Deleting…' : 'Delete Field'}
      confirmButtonProps={{ disabled: loading }}
      cancelButtonProps={{ color: 'inherit', disabled: loading }}
      dialogProps={{ maxWidth: 'sm', fullWidth: true }}
      dialogContentProps={{ dividers: true }}
    />
  );
};

export default FieldDeleteDialog;
