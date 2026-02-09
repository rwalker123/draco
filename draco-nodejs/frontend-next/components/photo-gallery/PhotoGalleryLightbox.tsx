import React, { useEffect } from 'react';
import {
  Box,
  Dialog,
  IconButton,
  Typography,
  useTheme,
  Slide,
  type SlideProps,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import type { PhotoGalleryPhotoType } from '@draco/shared-schemas';
import { formatDisplayDate } from './utils';

type TransitionProps = Omit<SlideProps, 'direction'>;

const Transition = React.forwardRef<unknown, TransitionProps>(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface PhotoGalleryLightboxProps {
  open: boolean;
  photo: PhotoGalleryPhotoType | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const PhotoGalleryLightbox: React.FC<PhotoGalleryLightboxProps> = ({
  open,
  photo,
  onClose,
  onNext,
  onPrev,
}) => {
  const theme = useTheme();
  const imageSrc = photo?.originalUrl ?? photo?.primaryUrl ?? photo?.thumbnailUrl ?? null;
  const imageAlt = photo?.title ?? 'Selected gallery photo';

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) {
        return;
      }

      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        onNext();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose, onNext, onPrev]);

  const submittedOn = photo?.submittedAt ? formatDisplayDate(photo.submittedAt) : null;

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(16px)',
        },
      }}
      aria-labelledby="photo-lightbox-title"
    >
      <Box
        sx={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          color: 'common.white',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(10,16,37,0.9) 0%, rgba(10,16,37,0.45) 40%, rgba(10,16,37,0.9) 100%)',
            pointerEvents: 'none',
          }}
        />

        <IconButton
          onClick={onClose}
          aria-label="Close gallery"
          sx={{
            position: 'absolute',
            top: { xs: 8, sm: 16 },
            right: { xs: 8, sm: 16 },
            backgroundColor: 'rgba(15,23,42,0.6)',
            color: 'common.white',
            '&:hover': {
              backgroundColor: 'rgba(15,23,42,0.8)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>

        <IconButton
          onClick={onPrev}
          aria-label="Previous photo"
          sx={{
            position: 'absolute',
            top: '50%',
            left: { xs: 4, sm: 16 },
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(15,23,42,0.6)',
            color: 'common.white',
            '&:hover': {
              backgroundColor: 'rgba(15,23,42,0.8)',
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>

        <IconButton
          onClick={onNext}
          aria-label="Next photo"
          sx={{
            position: 'absolute',
            top: '50%',
            right: { xs: 4, sm: 16 },
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(15,23,42,0.6)',
            color: 'common.white',
            '&:hover': {
              backgroundColor: 'rgba(15,23,42,0.8)',
            },
          }}
        >
          <ArrowForwardIcon />
        </IconButton>

        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: { xs: 2, sm: 6 },
            py: { xs: 8, sm: 10 },
          }}
        >
          {imageSrc ? (
            <Box
              component="img"
              src={imageSrc}
              alt={imageAlt}
              sx={{
                maxHeight: '70%',
                maxWidth: '90%',
                objectFit: 'contain',
                borderRadius: 3,
                boxShadow: theme.shadows[12],
              }}
            />
          ) : null}
        </Box>

        <Box
          sx={{
            position: 'relative',
            px: { xs: 3, sm: 6 },
            pb: { xs: 4, sm: 6 },
            pt: { xs: 2, sm: 4 },
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            backgroundImage:
              'linear-gradient(180deg, rgba(15,23,42,0) 0%, rgba(15,23,42,0.65) 60%, rgba(15,23,42,0.9) 100%)',
          }}
        >
          <Typography id="photo-lightbox-title" variant="h4" sx={{ fontWeight: 700 }}>
            {photo?.title}
          </Typography>
          {photo?.caption ? (
            <Typography
              variant="body1"
              sx={{ maxWidth: 640, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}
            >
              {photo.caption}
            </Typography>
          ) : null}
          <Box display="flex" gap={2} flexWrap="wrap" sx={{ color: 'rgba(255,255,255,0.72)' }}>
            {photo?.albumTitle ? (
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Album: {photo.albumTitle}
              </Typography>
            ) : null}
            {submittedOn ? (
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Submitted: {submittedOn}
              </Typography>
            ) : null}
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default PhotoGalleryLightbox;
