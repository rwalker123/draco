import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, IconButton, Tooltip } from '@mui/material';
import { PhotoCamera as PhotoCameraIcon, Close as CloseIcon } from '@mui/icons-material';
import Image from 'next/image';
import { getPhotoSize, validateContactPhotoFile, addCacheBuster } from '../config/contacts';

interface ContactPhotoUploadProps {
  contactId: string;
  contactName?: string;
  initialPhotoUrl?: string | null;
  onPhotoChange: (file: File | null) => void;
  onPhotoDelete?: () => Promise<void>;
  disabled?: boolean;
  error?: string | null;
  showDeleteOnHover?: boolean;
  clickToUpload?: boolean;
}

const ContactPhotoUpload: React.FC<ContactPhotoUploadProps> = ({
  contactId,
  contactName,
  initialPhotoUrl,
  onPhotoChange,
  onPhotoDelete,
  disabled = false,
  error,
  showDeleteOnHover = true,
  clickToUpload = true,
}) => {
  const PHOTO_SIZE = getPhotoSize();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoPreviewError, setPhotoPreviewError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (initialPhotoUrl) {
      // Add cache buster to initial photo URL to ensure fresh image
      setPhotoPreview(addCacheBuster(initialPhotoUrl));
    } else {
      setPhotoPreview(null);
    }
    setPhotoFile(null);
    setPhotoPreviewError(false);
  }, [initialPhotoUrl, contactId]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      const validationError = validateContactPhotoFile(file);
      if (validationError) {
        // Error will be handled by parent component
        onPhotoChange(null);
        return;
      }

      setPhotoFile(file);
      onPhotoChange(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
        setPhotoPreviewError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoDelete = async () => {
    if (onPhotoDelete && !isDeleting) {
      setIsDeleting(true);
      try {
        await onPhotoDelete();
        setPhotoPreview(null);
        setPhotoFile(null);
        onPhotoChange(null);
      } catch (error) {
        console.error('Error deleting photo:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleImageError = () => {
    setPhotoPreviewError(true);
  };

  // Generate initials for fallback
  const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const hasPhoto = (photoPreview && !photoPreviewError) || photoFile;
  const canDelete = hasPhoto && onPhotoDelete && showDeleteOnHover;

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Contact Photo
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Box
          sx={{
            width: PHOTO_SIZE,
            height: PHOTO_SIZE,
            bgcolor: hasPhoto ? 'transparent' : 'grey.300',
            borderRadius: 1,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            cursor: clickToUpload && !disabled ? 'pointer' : 'default',
            '&:hover':
              clickToUpload && !disabled
                ? {
                    '& .upload-overlay': {
                      opacity: hasPhoto ? 0.8 : 0.1,
                    },
                  }
                : {},
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={
            clickToUpload && !disabled
              ? () => {
                  const input = document.getElementById(
                    `photo-upload-${contactId}`,
                  ) as HTMLInputElement;
                  input?.click();
                }
              : undefined
          }
        >
          {hasPhoto && photoPreview ? (
            <Image
              src={photoPreview}
              alt="Contact photo preview"
              fill
              style={{ objectFit: 'cover' }}
              unoptimized
              onError={handleImageError}
            />
          ) : (
            <Typography variant="h6" sx={{ fontSize: '1.2rem', color: 'text.secondary' }}>
              {getInitials(contactName)}
            </Typography>
          )}

          {/* Upload overlay */}
          {clickToUpload && !disabled && (
            <Box
              className="upload-overlay"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.2s ease-in-out',
              }}
            >
              <PhotoCameraIcon sx={{ color: 'white', fontSize: '2rem' }} />
            </Box>
          )}

          {/* Delete button on hover */}
          {canDelete && isHovered && !isDeleting && (
            <Tooltip title="Delete Photo">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePhotoDelete();
                }}
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  color: 'error.main',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* Loading indicator for delete */}
          {isDeleting && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress size={24} />
            </Box>
          )}
        </Box>

        {/* Upload button (if click to upload is disabled) */}
        {!clickToUpload && (
          <Button
            variant="outlined"
            component="label"
            startIcon={<PhotoCameraIcon />}
            disabled={disabled}
          >
            Upload Photo
            <input
              id={`photo-upload-${contactId}`}
              type="file"
              hidden
              accept="image/*"
              onChange={handlePhotoChange}
              disabled={disabled}
            />
          </Button>
        )}

        {/* Hidden input for click to upload */}
        {clickToUpload && (
          <input
            id={`photo-upload-${contactId}`}
            type="file"
            hidden
            accept="image/*"
            onChange={handlePhotoChange}
            disabled={disabled}
          />
        )}
      </Box>

      <Typography variant="caption" color="textSecondary">
        Recommended size: {PHOTO_SIZE}x{PHOTO_SIZE} pixels. Max file size: 10MB.
        {clickToUpload && ' Click photo to upload.'}
        {canDelete && ' Hover to delete.'}
      </Typography>

      {error && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default ContactPhotoUpload;
