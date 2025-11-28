'use client';

import React, { useId, useRef } from 'react';
import { Box, CircularProgress } from '@mui/material';
import type { BaseContactType, ContactType } from '@draco/shared-schemas';
import UserAvatar from './UserAvatar';
import { useContactPhotoUpload } from '@/hooks/useContactPhotoUpload';

interface EditableContactAvatarProps {
  accountId: string;
  contact: BaseContactType;
  size: number;
  canEdit: boolean;
  onPhotoUpdated?: (contact: ContactType) => void;
  onError?: (message: string) => void;
}

/**
 * EditableContactAvatar Component.
 * Displays a contact avatar with inline photo editing capability.
 * Allows authorized users to upload photos by clicking on the avatar.
 *
 * @param props.accountId - Account ID associated with the contact.
 * @param props.contact - Contact whose avatar is displayed and can be edited.
 * @param props.size - Avatar size in pixels.
 * @param props.canEdit - Whether the current user can edit the contact photo.
 * @param props.onPhotoUpdated - Optional callback when the photo upload succeeds.
 * @param props.onError - Optional callback when the photo upload fails.
 */
const EditableContactAvatar: React.FC<EditableContactAvatarProps> = ({
  accountId,
  contact,
  size,
  canEdit,
  onPhotoUpdated,
  onError,
}) => {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { uploadContactPhoto, loading } = useContactPhotoUpload(accountId);

  const firstName = contact.firstName?.trim() || 'User';
  const lastName = contact.lastName?.trim() || 'Member';

  const handleAvatarClick = () => {
    if (!canEdit) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const result = await uploadContactPhoto(contact, file);
    event.target.value = '';

    if (result.success && result.contact) {
      onPhotoUpdated?.(result.contact);
    } else if (result.error) {
      onError?.(result.error);
    }
  };

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <UserAvatar
        user={{ id: contact.id, firstName, lastName, photoUrl: contact.photoUrl ?? undefined }}
        size={size}
        onClick={canEdit ? handleAvatarClick : undefined}
        showHoverEffects={canEdit}
        enablePhotoActions={canEdit}
      />
      <input
        id={`contact-photo-${inputId}`}
        ref={fileInputRef}
        type="file"
        hidden
        accept="image/*"
        onChange={handleFileChange}
        disabled={loading}
      />
      {loading ? (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.6)',
            borderRadius: '50%',
          }}
        >
          <CircularProgress size={size * 0.4} />
        </Box>
      ) : null}
    </Box>
  );
};

export default EditableContactAvatar;
