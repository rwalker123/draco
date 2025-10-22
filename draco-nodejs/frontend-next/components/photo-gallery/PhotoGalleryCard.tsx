import React from 'react';
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  type SxProps,
  type Theme,
} from '@mui/material';
import LaunchIcon from '@mui/icons-material/Launch';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { PhotoGalleryPhotoType } from '@draco/shared-schemas';
import type { SystemStyleObject } from '@mui/system';
import {
  formatDisplayDate,
  getPhotoThumbnailSrc,
  PHOTO_GALLERY_THUMBNAIL_DIMENSIONS,
} from './utils';

export type PhotoGalleryCardVariant = 'standard' | 'admin';

export interface PhotoGalleryCardProps {
  photo: PhotoGalleryPhotoType;
  variant?: PhotoGalleryCardVariant;
  onClick?: () => void;
  onEdit?: (photo: PhotoGalleryPhotoType) => void;
  onDelete?: (photo: PhotoGalleryPhotoType) => void;
  albumLabel?: string | null;
  disableOriginalLink?: boolean;
  sx?: SxProps<Theme>;
}

const PhotoGalleryCard: React.FC<PhotoGalleryCardProps> = ({
  photo,
  variant = 'standard',
  onClick,
  onEdit,
  onDelete,
  albumLabel,
  disableOriginalLink = false,
  sx,
}) => {
  const imageSrc = getPhotoThumbnailSrc(photo);
  const submittedOn = formatDisplayDate(photo.submittedAt);
  const interactive = Boolean(onClick);
  const showAlbumOverlay =
    variant === 'admin' && (albumLabel ?? photo.albumTitle ?? 'Account Album');
  const showAdminControls = variant === 'admin' && (onEdit || onDelete);

  return (
    <Box
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `View photo ${photo.title}` : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!interactive) {
          return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick?.();
        }
      }}
      sx={[
        {
          position: 'relative',
          flex: '0 0 auto',
          width: 200,
          borderRadius: 3,
          px: 2,
          py: 2,
          backgroundColor: 'rgba(15,23,42,0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          cursor: interactive ? 'pointer' : 'default',
          transition: 'transform 0.25s ease, box-shadow 0.25s ease',
          '&:hover': interactive
            ? {
                transform: 'translateY(-4px)',
                boxShadow: '0 18px 40px rgba(15, 23, 42, 0.18)',
              }
            : undefined,
          '&:focus-visible': interactive
            ? {
                outline: '2px solid',
                outlineColor: 'primary.main',
                outlineOffset: '4px',
              }
            : undefined,
        } as SystemStyleObject<Theme>,
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Box
        sx={{
          position: 'relative',
        }}
      >
        <Box
          sx={{
            width: PHOTO_GALLERY_THUMBNAIL_DIMENSIONS.width,
            height: PHOTO_GALLERY_THUMBNAIL_DIMENSIONS.height,
            borderRadius: 2,
            overflow: 'hidden',
            alignSelf: 'center',
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.22)',
            position: 'relative',
          }}
        >
          <Box
            component="img"
            src={imageSrc}
            alt={photo.title}
            loading="lazy"
            sx={{
              width: '100%',
              height: '100%',
              display: 'block',
              objectFit: 'cover',
            }}
          />
          {showAlbumOverlay ? (
            <Chip
              label={typeof showAlbumOverlay === 'string' ? showAlbumOverlay : photo.albumTitle}
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                bgcolor: 'rgba(0,0,0,0.6)',
                color: 'rgba(255,255,255,0.95)',
                fontWeight: 500,
                maxWidth: 'calc(100% - 16px)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            />
          ) : null}
          {showAdminControls ? (
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                px: 1,
                py: 0.5,
                background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.65) 100%)',
              }}
            >
              <Tooltip title={photo.title} placement="top-start">
                <Typography variant="caption" color="common.white" noWrap sx={{ maxWidth: '65%' }}>
                  {photo.title}
                </Typography>
              </Tooltip>
              <Stack direction="row" spacing={0.5} alignItems="center">
                {onEdit ? (
                  <Tooltip title="Edit photo">
                    <IconButton
                      onClick={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                        onEdit(photo);
                      }}
                      size="small"
                      sx={{ color: 'common.white' }}
                      aria-label="Edit photo"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : null}
                {onDelete ? (
                  <Tooltip title="Delete photo">
                    <IconButton
                      onClick={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                        onDelete(photo);
                      }}
                      size="small"
                      sx={{ color: 'error.light' }}
                      aria-label="Delete photo"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Stack>
            </Box>
          ) : null}
        </Box>
      </Box>
      <Box display="flex" flexDirection="column" gap={1} sx={{ textAlign: 'left' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {photo.title}
        </Typography>
        {photo.caption ? (
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              overflow: 'hidden',
              WebkitBoxOrient: 'vertical',
            }}
          >
            {photo.caption}
          </Typography>
        ) : null}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 'auto',
            color: 'text.secondary',
          }}
        >
          {submittedOn ? (
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {submittedOn}
            </Typography>
          ) : null}
          {!disableOriginalLink ? (
            <IconButton
              component="a"
              href={photo.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              aria-label="Open original photo"
              sx={{
                color: 'primary.main',
              }}
              onClick={(event) => {
                if (!interactive) {
                  return;
                }
                event.stopPropagation();
              }}
            >
              <LaunchIcon fontSize="inherit" />
            </IconButton>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
};

export default PhotoGalleryCard;
