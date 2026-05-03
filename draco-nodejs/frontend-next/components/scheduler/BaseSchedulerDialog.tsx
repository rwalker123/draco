'use client';

import React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';

export interface BaseSchedulerDialogProps {
  open: boolean;
  title: string;
  mode: 'create' | 'edit';
  loading?: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitDisabled?: boolean;
  apiError?: string | null;
  children: React.ReactNode;
}

export const BaseSchedulerDialog: React.FC<BaseSchedulerDialogProps> = ({
  open,
  title,
  mode,
  loading,
  onClose,
  onSubmit,
  submitDisabled,
  apiError,
  children,
}) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        {apiError && <Alert severity="error">{apiError}</Alert>}
        {children}
      </Box>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <Button
        variant="contained"
        onClick={onSubmit}
        disabled={loading || submitDisabled}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
      >
        {mode === 'create' ? 'Create' : 'Save'}
      </Button>
    </DialogActions>
  </Dialog>
);
