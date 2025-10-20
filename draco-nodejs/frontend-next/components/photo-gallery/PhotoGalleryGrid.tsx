import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, LinearProgress, Skeleton, Typography, IconButton } from '@mui/material';
import LaunchIcon from '@mui/icons-material/Launch';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import type { PhotoGalleryPhotoType } from '@draco/shared-schemas';

export const formatDisplayDate = (value: string | null): string | null => {
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
  onClick?: () => void;
}

const GalleryCard: React.FC<GalleryCardProps> = ({ photo, onClick }) => {
  const submittedOn = formatDisplayDate(photo.submittedAt);
  const thumbnailSrc = photo.thumbnailUrl ?? photo.primaryUrl ?? photo.originalUrl;

  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label={`View photo ${photo.title}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) {
          return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      sx={{
        flex: '0 0 auto',
        width: 200,
        borderRadius: 3,
        px: 2,
        py: 2,
        backgroundColor: 'rgba(15,23,42,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 18px 40px rgba(15, 23, 42, 0.18)',
        },
        '&:focus-visible': onClick
          ? {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: '4px',
            }
          : undefined,
      }}
    >
      <Box
        sx={{
          width: 160,
          height: 90,
          borderRadius: 2,
          overflow: 'hidden',
          alignSelf: 'center',
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.22)',
        }}
      >
        <Box
          component="img"
          src={thumbnailSrc}
          alt={photo.title}
          loading="lazy"
          sx={{
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'cover',
          }}
        />
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
          >
            <LaunchIcon fontSize="inherit" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

interface PhotoGalleryGridProps {
  photos: PhotoGalleryPhotoType[];
  loading?: boolean;
  emptyMessage?: string;
  onPhotoClick?: (photoIndex: number) => void;
  photoIndexOffset?: number;
}

const PhotoGalleryGrid: React.FC<PhotoGalleryGridProps> = ({
  photos,
  loading = false,
  emptyMessage = 'No photos have been added yet.',
  onPhotoClick,
  photoIndexOffset = 0,
}) => {
  const showSkeletons = loading && photos.length === 0;
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollAffordances = useCallback(() => {
    const container = scrollContainerRef.current;

    if (!container) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const { scrollLeft, clientWidth, scrollWidth } = container;
    const tolerance = 8;

    setCanScrollLeft(scrollLeft > tolerance);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - tolerance);
  }, []);

  const handleScrollThumbnails = useCallback(
    (direction: 'backward' | 'forward') => {
      const container = scrollContainerRef.current;

      if (!container) {
        return;
      }

      const scrollAmount = container.clientWidth * 0.85;
      const delta = direction === 'forward' ? scrollAmount : -scrollAmount;

      container.scrollBy({ left: delta, behavior: 'smooth' });

      window.requestAnimationFrame(updateScrollAffordances);
    },
    [updateScrollAffordances],
  );

  useEffect(() => {
    updateScrollAffordances();
  }, [photos.length, updateScrollAffordances]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return undefined;
    }

    const handleScroll = () => {
      updateScrollAffordances();
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateScrollAffordances);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateScrollAffordances);
    };
  }, [updateScrollAffordances]);

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
      <Box sx={{ position: 'relative' }}>
        <IconButton
          aria-label="Scroll previous photos"
          onClick={() => handleScrollThumbnails('backward')}
          disabled={!canScrollLeft}
          sx={{
            position: 'absolute',
            top: '50%',
            left: { xs: 8, sm: 12 },
            transform: 'translateY(-50%)',
            zIndex: 2,
            bgcolor: 'background.paper',
            boxShadow: 2,
            color: 'text.primary',
            '&:hover': {
              bgcolor: 'background.paper',
            },
            '&.Mui-disabled': {
              boxShadow: 'none',
            },
          }}
        >
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
        <Box
          ref={scrollContainerRef}
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            pb: 1,
            scrollSnapType: 'x mandatory',
            px: { xs: 3, sm: 1 },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': {
              display: 'none',
            },
          }}
        >
          {showSkeletons
            ? Array.from({ length: 6 }).map((_, index) => (
                <Skeleton
                  key={`skeleton-${index}`}
                  variant="rectangular"
                  height={120}
                  sx={{
                    borderRadius: 3,
                    width: 200,
                  }}
                />
              ))
            : null}
          {!showSkeletons &&
            photos.map((photo, index) => (
              <GalleryCard
                key={photo.id}
                photo={photo}
                onClick={
                  onPhotoClick
                    ? () => {
                        onPhotoClick(photoIndexOffset + index);
                      }
                    : undefined
                }
              />
            ))}
        </Box>
        <IconButton
          aria-label="Scroll next photos"
          onClick={() => handleScrollThumbnails('forward')}
          disabled={!canScrollRight}
          sx={{
            position: 'absolute',
            top: '50%',
            right: { xs: 8, sm: 12 },
            transform: 'translateY(-50%)',
            zIndex: 2,
            bgcolor: 'background.paper',
            boxShadow: 2,
            color: 'text.primary',
            '&:hover': {
              bgcolor: 'background.paper',
            },
            '&.Mui-disabled': {
              boxShadow: 'none',
            },
          }}
        >
          <ArrowForwardIosIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default PhotoGalleryGrid;
