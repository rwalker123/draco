'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import type { BaseContactType, ContactType } from '@draco/shared-schemas';
import EditableContactAvatar, { EditableContactAvatarHandle } from './EditableContactAvatar';
import { getContactDisplayName } from '@/utils/contactUtils';
import { useContactPhotoUpload } from '@/hooks/useContactPhotoUpload';
import Alert from '@mui/material/Alert';

interface ContactPhotoUploadDialogProps {
  open: boolean;
  accountId: string;
  contact: BaseContactType | null;
  canEdit: boolean;
  onClose: () => void;
  onPhotoUpdated?: (contact: ContactType) => void;
  onError?: (message: string) => void;
}

const ContactPhotoUploadDialog: React.FC<ContactPhotoUploadDialogProps> = ({
  open,
  accountId,
  contact,
  canEdit,
  onClose,
  onPhotoUpdated,
  onError,
}) => {
  const avatarRef = useRef<EditableContactAvatarHandle | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const { uploadContactPhoto, loading, error, clearError } = useContactPhotoUpload(accountId);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleUploadClick = () => {
    avatarRef.current?.openFilePicker();
  };

  const handleFileSelected = (file: File) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setLocalError(null);
    clearError();
  };

  const handlePhotoUpdated = (updatedContact: ContactType) => {
    setSelectedFile(null);
    setPreviewUrl(null);
    onPhotoUpdated?.(updatedContact);
    onClose();
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setLocalError(null);
    clearError();
    onClose();
  };

  const handleSave = async () => {
    if (!contact) {
      return;
    }
    if (!selectedFile) {
      setLocalError('Please select a photo to upload.');
      return;
    }

    const result = await uploadContactPhoto(contact, selectedFile);
    if (result.success && result.contact) {
      handlePhotoUpdated(result.contact);
      return;
    }
    const failure = result.error || 'Failed to update contact photo';
    setLocalError(failure);
    onError?.(failure);
  };

  if (!contact) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Update Player Photo</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          {getContactDisplayName(contact)}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <EditableContactAvatar
            key={previewUrl || contact.photoUrl || contact.id}
            ref={avatarRef}
            accountId={accountId}
            contact={previewUrl ? { ...contact, photoUrl: previewUrl } : contact}
            size={72}
            canEdit={canEdit}
            uploadOnSelect={false}
            onFileSelected={handleFileSelected}
          />
          <Button
            variant="outlined"
            startIcon={<PhotoCameraIcon />}
            onClick={handleUploadClick}
            disabled={!canEdit || loading}
          >
            {selectedFile ? 'Change Photo' : 'Upload Photo'}
          </Button>
        </Box>
        {selectedFile ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Box
              component="img"
              src={previewUrl || ''}
              alt="Selected photo preview"
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                objectFit: 'cover',
                border: (theme) => `1px solid ${theme.palette.divider}`,
                bgcolor: (theme) => theme.palette.background.default,
              }}
            />
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              {selectedFile.name}
            </Typography>
          </Box>
        ) : null}
        {localError || error ? (
          <Alert severity="error" sx={{ mb: 1 }}>
            {localError || error}
          </Alert>
        ) : null}
        <Typography variant="caption" color="text.secondary">
          Recommended size: 60x60 pixels. Max file size: 10MB.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!canEdit || loading || !selectedFile}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContactPhotoUploadDialog;
