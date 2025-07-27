'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { RemoveRoleDialogProps } from '../../types/users';

/**
 * RemoveRoleDialog Component
 * Confirmation dialog for role removal
 */
const RemoveRoleDialog: React.FC<RemoveRoleDialogProps> = ({
  open,
  onClose,
  onRemove,
  selectedUser,
  selectedRoleToRemove,
  loading,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Remove Role</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mt: 1 }}>
          Are you sure you want to remove the role &quot;
          {selectedRoleToRemove?.roleName || selectedRoleToRemove?.roleId}&quot; from{' '}
          {selectedUser?.firstName} {selectedUser?.lastName}?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onRemove}
          variant="contained"
          color="error"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
        >
          Remove Role
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RemoveRoleDialog;
