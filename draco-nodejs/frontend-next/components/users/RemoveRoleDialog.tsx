'use client';

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import { Delete as DeleteIcon, Person as PersonIcon } from '@mui/icons-material';
import { RemoveRoleDialogProps } from '../../types/users';
import { useRoleRemoval } from '../../hooks/useRoleRemoval';

/**
 * RemoveRoleDialog Component
 * Self-contained confirmation dialog for role removal with internal error handling
 */
const RemoveRoleDialog: React.FC<RemoveRoleDialogProps> = ({
  open,
  onClose,
  onSuccess,
  selectedUser,
  selectedRoleToRemove,
  accountId,
}) => {
  const [error, setError] = useState<string | null>(null);
  const { removeRole, loading } = useRoleRemoval(accountId);

  // Handle role removal with internal error handling
  const handleRemoveRole = useCallback(async () => {
    if (!selectedUser || !selectedRoleToRemove) return;

    // Clear any previous errors
    setError(null);

    const result = await removeRole({
      user: selectedUser,
      role: selectedRoleToRemove,
    });

    if (result.success) {
      onSuccess?.({
        message: result.message || 'Role removed successfully',
        removedRole: result.removedRole!,
      });
      onClose(); // Close dialog on success
    } else {
      // Handle error internally
      setError(result.error || 'Failed to remove role');
    }
  }, [selectedUser, selectedRoleToRemove, removeRole, onSuccess, onClose]);

  // Clear error when dialog opens
  React.useEffect(() => {
    if (open) {
      setError(null);
    }
  }, [open]);

  if (!selectedUser || !selectedRoleToRemove) {
    return null; // Don't render if missing required data
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Remove Role</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Error display */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Typography variant="body1">
            Are you sure you want to remove the role &quot;
            {selectedRoleToRemove?.roleName || selectedRoleToRemove?.roleId}&quot; from:
          </Typography>

          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              p: 2,
              bgcolor: 'grey.50',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.300',
            }}
          >
            <PersonIcon color="action" />
            <Typography variant="subtitle2" fontWeight="bold">
              {selectedUser.firstName} {selectedUser.lastName}
            </Typography>
            {selectedUser.email && (
              <Typography variant="body2" color="text.secondary">
                ({selectedUser.email})
              </Typography>
            )}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleRemoveRole}
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
