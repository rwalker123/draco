import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Box, Chip, Typography, IconButton } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import type { PhotoGalleryPhotoType } from '@draco/shared-schemas';
import { formatDisplayDate } from './PhotoGalleryGrid';

interface PhotoGalleryHeroProps {
  photos: PhotoGalleryPhotoType[];
  onSelect?: (photoIndex: number) => void;
  autoAdvanceMs?: number;
}

const MAX_HERO_ITEMS = 10;
const DEFAULT_INTERVAL = 6000;

const PhotoGalleryHero: React.FC<PhotoGalleryHeroProps> = ({
  photos,
  onSelect,
  autoAdvanceMs = DEFAULT_INTERVAL,
}) => {
  const heroPhotos = useMemo(
    () => photos.slice(0, Math.min(MAX_HERO_ITEMS, photos.length)),
    [photos],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (heroPhotos.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % heroPhotos.length);
    }, autoAdvanceMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [autoAdvanceMs, heroPhotos.length]);

  useEffect(() => {
    if (activeIndex >= heroPhotos.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, heroPhotos.length]);

  const handleSelect = useCallback(
    (index: number) => {
      setActiveIndex(index);
      if (onSelect) {
        onSelect(index);
      }
    },
    [onSelect],
  );

  const handlePrev = useCallback(() => {
    setActiveIndex((current) => {
      const next = (current - 1 + heroPhotos.length) % heroPhotos.length;
      return next;
    });
  }, [heroPhotos.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % heroPhotos.length);
  }, [heroPhotos.length]);

  if (heroPhotos.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        overflow: 'visible',
        py: { xs: 1.5, sm: 2 },
      }}
    >
      <IconButton
        aria-label="Previous featured photo"
        onClick={handlePrev}
        disabled={heroPhotos.length <= 1}
        sx={{
          position: 'absolute',
          top: '50%',
          left: { xs: 8, sm: 16 },
          transform: 'translateY(-50%)',
          zIndex: 20,
          bgcolor: 'rgba(15,23,42,0.5)',
          color: 'common.white',
          '&:hover': { bgcolor: 'rgba(15,23,42,0.7)' },
        }}
      >
        <ArrowBackIcon />
      </IconButton>
      <IconButton
        aria-label="Next featured photo"
        onClick={handleNext}
        disabled={heroPhotos.length <= 1}
        sx={{
          position: 'absolute',
          top: '50%',
          right: { xs: 8, sm: 16 },
          transform: 'translateY(-50%)',
          zIndex: 20,
          bgcolor: 'rgba(15,23,42,0.5)',
          color: 'common.white',
          '&:hover': { bgcolor: 'rgba(15,23,42,0.7)' },
        }}
      >
        <ArrowForwardIcon />
      </IconButton>

      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 4, sm: 8 },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: 'min(100%, 760px)',
            aspectRatio: '16 / 9',
          }}
        >
          {heroPhotos.map((photo, index) => {
            const offset = index - activeIndex;
            const normalizedOffset =
              ((offset + heroPhotos.length + Math.floor(heroPhotos.length / 2)) %
                heroPhotos.length) -
              Math.floor(heroPhotos.length / 2);
            const isActive = index === activeIndex;
            const submittedOn = formatDisplayDate(photo.submittedAt);
            const primarySrc = photo.primaryUrl ?? photo.originalUrl;

            return (
              <Box
                key={photo.id}
                onClick={() => handleSelect(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleSelect(index);
                  }
                }}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '100%',
                  height: '100%',
                  transform: `translate(-50%, -50%) translateX(${normalizedOffset * 30}px) translateY(${
                    Math.abs(normalizedOffset) * 6
                  }px) scale(${isActive ? 1 : 0.92})`,
                  transformOrigin: 'center',
                  transition: 'transform 0.6s ease, opacity 0.6s ease',
                  cursor: 'pointer',
                  zIndex: heroPhotos.length - Math.abs(normalizedOffset),
                  opacity: Math.abs(normalizedOffset) > 2 ? 0 : 1,
                  borderRadius: 4,
                  overflow: 'hidden',
                  boxShadow: '0 30px 90px rgba(15, 23, 42, 0.45)',
                  backgroundColor: 'rgba(15,23,42,0.85)',
                }}
              >
                <Box
                  component="img"
                  src={primarySrc}
                  alt={photo.title}
                  loading="lazy"
                  sx={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    backgroundColor: 'rgba(15,23,42,0.9)',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(190deg, rgba(15,23,42,0.05) 0%, rgba(15,23,42,0.65) 60%, rgba(15,23,42,0.9) 100%)',
                  }}
                />
                {isActive ? (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      gap: 1.5,
                      p: { xs: 3, sm: 4 },
                      color: 'common.white',
                    }}
                  >
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {photo.albumTitle ? (
                        <Chip
                          size="small"
                          label={photo.albumTitle}
                          sx={{
                            bgcolor: 'rgba(129,140,248,0.28)',
                            color: 'rgba(255,255,255,0.9)',
                            fontWeight: 600,
                            backdropFilter: 'blur(6px)',
                          }}
                        />
                      ) : null}
                      {submittedOn ? (
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.78)' }}>
                          {submittedOn}
                        </Typography>
                      ) : null}
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {photo.title}
                    </Typography>
                    {photo.caption ? (
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                        {photo.caption}
                      </Typography>
                    ) : null}
                  </Box>
                ) : null}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default PhotoGalleryHero;
