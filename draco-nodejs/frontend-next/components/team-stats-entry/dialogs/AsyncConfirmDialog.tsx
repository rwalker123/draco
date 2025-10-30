'use client';

import React, { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

interface AsyncConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmColor?: 'error' | 'primary';
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const AsyncConfirmDialog: React.FC<AsyncConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmColor = 'primary',
  onClose,
  onConfirm,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await onConfirm();
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'There was a problem completing the request.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Typography>{description}</Typography>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={() => void handleConfirm()}
          variant="contained"
          color={confirmColor}
          disabled={submitting}
        >
          {submitting ? 'Working...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AsyncConfirmDialog;
