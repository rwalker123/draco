'use client';

import React, { useState, memo, useMemo } from 'react';
import { Box, Typography, IconButton, Tooltip, SxProps, Theme } from '@mui/material';
import { PhotoCamera as PhotoCameraIcon, Close as CloseIcon } from '@mui/icons-material';
import Image from 'next/image';
import { EnhancedUser } from '../../types/userTable';
import { addCacheBuster } from '../../config/contacts';

interface UserAvatarProps {
  user: Pick<EnhancedUser, 'firstName' | 'lastName' | 'photoUrl' | 'id'>;
  size: number;
  onClick?: (event: React.MouseEvent) => void;
  showHoverEffects?: boolean;
  enablePhotoActions?: boolean;
  onPhotoDelete?: (contactId: string) => Promise<void>;
  className?: string;
  sx?: SxProps<Theme>;
}

/**
 * UserAvatar Component
 * Reusable user photo avatar with fallback to initials
 * Follows DRY principles by centralizing photo display logic
 */
const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size,
  onClick,
  showHoverEffects = false,
  enablePhotoActions = false,
  onPhotoDelete,
  className,
  sx,
}) => {
  const [errorPhotoUrl, setErrorPhotoUrl] = useState<string | null>(null);
  const [isPhotoHovered, setIsPhotoHovered] = useState(false);

  // Memoize the cache-busted URL to prevent unnecessary re-requests
  // Only regenerate when the photoUrl actually changes
  const cachedPhotoUrl = useMemo(() => {
    if (!user.photoUrl) return null;
    return addCacheBuster(user.photoUrl);
  }, [user.photoUrl]);

  // Generate user initials for fallback
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  const hasPhoto = Boolean(user.photoUrl && errorPhotoUrl !== user.photoUrl);

  // Size-responsive delete button positioning
  const getDeleteButtonPosition = () => {
    if (size < 40) {
      return { top: -6, right: -6 };
    } else if (size < 60) {
      return { top: -8, right: -8 };
    } else {
      return { top: -8, right: -8 };
    }
  };

  const deleteButtonPos = getDeleteButtonPosition();

  return (
    <Box
      className={className}
      sx={{
        width: size,
        height: size,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        flexShrink: 0,
        // Note: No overflow hidden here to allow delete button to show
        ...sx,
      }}
      onMouseEnter={() => setIsPhotoHovered(true)}
      onMouseLeave={() => setIsPhotoHovered(false)}
      onClick={onClick}
    >
      {/* Inner container with overflow hidden for circular image clipping */}
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          bgcolor: !hasPhoto ? 'primary.main' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          '&:hover':
            showHoverEffects && onClick
              ? {
                  '& .photo-overlay': {
                    opacity: 1,
                  },
                }
              : {},
        }}
      >
        {hasPhoto && cachedPhotoUrl ? (
          <Image
            src={cachedPhotoUrl}
            alt={`${user.firstName} ${user.lastName} photo`}
            fill
            style={{ objectFit: 'cover', borderRadius: '50%' }}
            unoptimized
            onError={() => setErrorPhotoUrl(user.photoUrl ?? null)}
          />
        ) : (
          <Typography
            variant="h6"
            sx={{
              fontSize: size * 0.4,
              fontWeight: 600,
              color: 'white',
              lineHeight: 1,
            }}
          >
            {initials}
          </Typography>
        )}

        {/* Photo upload overlay for large avatars */}
        {enablePhotoActions && showHoverEffects && !user.photoUrl && (
          <Box
            className="photo-overlay"
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
            <PhotoCameraIcon sx={{ color: 'white', fontSize: size * 0.3 }} />
          </Box>
        )}
      </Box>

      {/* Delete photo button on hover for large avatars */}
      {enablePhotoActions &&
        user.photoUrl &&
        errorPhotoUrl !== user.photoUrl &&
        isPhotoHovered &&
        onPhotoDelete && (
          <Tooltip title="Delete Photo">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onPhotoDelete(user.id);
              }}
              sx={{
                position: 'absolute',
                top: deleteButtonPos.top,
                right: deleteButtonPos.right,
                backgroundColor: 'background.paper',
                color: 'error.main',
                boxShadow: 2,
                zIndex: 1,
                '&:hover': {
                  backgroundColor: 'error.main',
                  color: 'white',
                },
                padding: '4px',
                minWidth: size < 40 ? '20px' : '24px',
                height: size < 40 ? '20px' : '24px',
              }}
            >
              <CloseIcon
                fontSize={size < 40 ? 'inherit' : 'small'}
                sx={{ fontSize: size < 40 ? '12px' : '16px' }}
              />
            </IconButton>
          </Tooltip>
        )}
    </Box>
  );
};

// Memoize the component to prevent unnecessary re-renders when props haven't changed
export default memo(UserAvatar);
