import React from 'react';
import { Box, LinearProgress, Skeleton, Typography, IconButton } from '@mui/material';
import LaunchIcon from '@mui/icons-material/Launch';
import type { PhotoGalleryPhotoType } from '@draco/shared-schemas';

const formatDisplayDate = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

interface GalleryCardProps {
  photo: PhotoGalleryPhotoType;
}

const GalleryCard: React.FC<GalleryCardProps> = ({ photo }) => {
  const submittedOn = formatDisplayDate(photo.submittedAt);

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 3,
        overflow: 'hidden',
        minHeight: 260,
        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.24)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.28)',
        },
      }}
    >
      <Box
        component="img"
        src={photo.primaryUrl}
        alt={photo.title}
        loading="lazy"
        sx={{
          width: '100%',
          height: '100%',
          display: 'block',
          objectFit: 'cover',
          filter: 'brightness(0.92)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(15,23,42,0) 40%, rgba(15,23,42,0.85) 100%)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 2.5,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box
            sx={{
              bgcolor: 'rgba(15, 23, 42, 0.55)',
              color: 'rgba(255,255,255,0.85)',
              px: 1.5,
              py: 0.5,
              borderRadius: '999px',
              backdropFilter: 'blur(6px)',
              letterSpacing: 0.75,
              textTransform: 'uppercase',
              fontSize: 11,
              fontWeight: 700,
              maxWidth: '70%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {photo.albumTitle}
          </Box>
          <IconButton
            component="a"
            href={photo.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            sx={{
              bgcolor: 'rgba(15,23,42,0.55)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(15,23,42,0.75)',
              },
            }}
            aria-label="Open original photo"
          >
            <LaunchIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{ color: 'white' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {photo.title}
          </Typography>
          {photo.caption && (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.75 }}>
              {photo.caption}
            </Typography>
          )}
          {submittedOn && (
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.72)', mt: 1.5, display: 'block' }}
            >
              {submittedOn}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

interface PhotoGalleryGridProps {
  photos: PhotoGalleryPhotoType[];
  loading?: boolean;
  emptyMessage?: string;
}

const PhotoGalleryGrid: React.FC<PhotoGalleryGridProps> = ({
  photos,
  loading = false,
  emptyMessage = 'No photos have been added yet.',
}) => {
  const showSkeletons = loading && photos.length === 0;

  if (!loading && photos.length === 0) {
    return (
      <Box
        sx={{
          borderRadius: 3,
          border: '1px dashed rgba(15,23,42,0.16)',
          p: 5,
          textAlign: 'center',
          bgcolor: 'rgba(15,23,42,0.02)',
        }}
      >
        <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {loading && photos.length > 0 && <LinearProgress sx={{ mb: 2 }} />}
      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: {
            xs: 'repeat(1, minmax(0, 1fr))',
            sm: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(3, minmax(0, 1fr))',
          },
        }}
      >
        {showSkeletons
          ? Array.from({ length: 6 }).map((_, index) => (
              <Box key={`skeleton-${index}`}>
                <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 3 }} />
              </Box>
            ))
          : null}
        {!showSkeletons &&
          photos.map((photo) => (
            <Box key={photo.id}>
              <GalleryCard photo={photo} />
            </Box>
          ))}
      </Box>
    </Box>
  );
};

export default PhotoGalleryGrid;
