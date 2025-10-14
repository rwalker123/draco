'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import type { FieldType } from '@draco/shared-schemas';
import { useFieldService } from '../../hooks/useFieldService';

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

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Field</DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          {`Are you sure you want to delete ${field?.name ?? 'this field'}?`}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Deleting a field removes it from upcoming schedules and workouts. This action cannot be
          undone.
        </Typography>
        {error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleDelete} color="error" disabled={loading}>
          {loading ? 'Deleting…' : 'Delete Field'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FieldDeleteDialog;
