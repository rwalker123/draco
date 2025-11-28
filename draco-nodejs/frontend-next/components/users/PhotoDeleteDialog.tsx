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
  Box,
} from '@mui/material';
import { Delete as DeleteIcon, Photo as PhotoIcon } from '@mui/icons-material';
import { usePhotoOperations } from '../../hooks/usePhotoOperations';
import UserAvatar from './UserAvatar';
import type { BaseContactType } from '@draco/shared-schemas';

interface PhotoDeleteDialogProps {
  open: boolean;
  contactId: string | null;
  contact?: Pick<BaseContactType, 'id' | 'firstName' | 'lastName' | 'photoUrl'> | null;
  onClose: () => void;
  onSuccess?: (result: { message: string; contactId: string }) => void;
  accountId: string;
}

/**
 * PhotoDeleteDialog Component
 * Self-contained dialog for deleting contact photos with internal error handling
 */
const PhotoDeleteDialog: React.FC<PhotoDeleteDialogProps> = ({
  open,
  contactId,
  contact,
  onClose,
  onSuccess,
  accountId,
}) => {
  const [error, setError] = useState<string | null>(null);
  const { deletePhoto, loading } = usePhotoOperations(accountId);

  // Handle photo deletion with internal error handling
  const handleDeletePhoto = useCallback(async () => {
    if (!contactId) return;

    // Clear any previous errors
    setError(null);

    const result = await deletePhoto(contactId);

    if (result.success) {
      onSuccess?.({
        message: result.message || 'Photo deleted successfully',
        contactId: result.contactId!,
      });
      onClose(); // Close dialog on success
    } else {
      // Handle error internally
      setError(result.error || 'Failed to delete photo');
    }
  }, [contactId, deletePhoto, onSuccess, onClose]);

  // Clear error when dialog opens
  React.useEffect(() => {
    if (open) {
      setError(null);
    }
  }, [open]);

  if (!contactId) {
    return null; // Don't render if missing required data
  }

  const avatarUser = contact
    ? {
        id: contact.id,
        firstName: contact.firstName ?? 'User',
        lastName: contact.lastName ?? 'Member',
        photoUrl: contact.photoUrl ?? undefined,
      }
    : null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ color: (theme) => theme.palette.text.primary }}>Delete Photo</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Error display */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Stack direction="row" alignItems="center" spacing={2}>
            {avatarUser ? (
              <UserAvatar user={avatarUser} size={48} />
            ) : (
              <Box
                sx={(theme) => ({
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: theme.palette.action.hover,
                  color: theme.palette.text.secondary,
                })}
              >
                <PhotoIcon fontSize="small" />
              </Box>
            )}
            <Typography variant="body1">
              Are you sure you want to delete this photo? This action cannot be undone.
            </Typography>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleDeletePhoto}
          variant="contained"
          color="error"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
        >
          Delete Photo
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PhotoDeleteDialog;
