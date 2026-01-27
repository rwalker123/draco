'use client';

import React, { useState } from 'react';
import { Typography, CircularProgress, Alert, Stack, Box } from '@mui/material';
import { Delete as DeleteIcon, Photo as PhotoIcon } from '@mui/icons-material';
import { usePhotoOperations } from '../../hooks/usePhotoOperations';
import UserAvatar from './UserAvatar';
import type { BaseContactType } from '@draco/shared-schemas';
import ConfirmDeleteDialog from '../social/ConfirmDeleteDialog';

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
  const handleDeletePhoto = async () => {
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
  };

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
    <ConfirmDeleteDialog
      open={open}
      title="Delete Photo"
      content={
        <Stack spacing={2} sx={{ mt: 1 }}>
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
      }
      onClose={onClose}
      onConfirm={handleDeletePhoto}
      confirmLabel={loading ? 'Deleting...' : 'Delete Photo'}
      confirmButtonProps={{
        color: 'error',
        variant: 'contained',
        disabled: loading,
        startIcon: loading ? <CircularProgress size={20} /> : <DeleteIcon />,
      }}
      cancelButtonProps={{ disabled: loading }}
      dialogProps={{ maxWidth: 'sm', fullWidth: true }}
    />
  );
};

export default PhotoDeleteDialog;
