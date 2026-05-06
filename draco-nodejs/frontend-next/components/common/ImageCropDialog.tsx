'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
  Stack,
  Typography,
} from '@mui/material';
import Cropper, { Area, MediaSize, Point } from 'react-easy-crop';
import { ImageCropPreset } from '../../config/imageCropPresets';
import { buildCroppedFile, cropImageToBlob } from '../../utils/imageCrop';

interface ImageCropDialogProps {
  open: boolean;
  sourceFile: File | null;
  preset: ImageCropPreset;
  title?: string;
  onClose: () => void;
  onCropConfirm: (croppedFile: File) => void;
}

const DEFAULT_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.05;
const ABSOLUTE_MIN_ZOOM = 0.1;

const computeContainZoom = (mediaSize: MediaSize, cropAspect: number): number => {
  if (!mediaSize.naturalWidth || !mediaSize.naturalHeight || !cropAspect) {
    return DEFAULT_ZOOM;
  }
  const imageAspect = mediaSize.naturalWidth / mediaSize.naturalHeight;
  const ratio = Math.min(imageAspect, cropAspect) / Math.max(imageAspect, cropAspect);
  return Math.max(ABSOLUTE_MIN_ZOOM, Math.min(DEFAULT_ZOOM, ratio));
};

const ImageCropDialog: React.FC<ImageCropDialogProps> = ({
  open,
  sourceFile,
  preset,
  title,
  onClose,
  onCropConfirm,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [minZoom, setMinZoom] = useState(DEFAULT_ZOOM);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !sourceFile) {
      setImageSrc(null);
      return;
    }

    const objectUrl = URL.createObjectURL(sourceFile);
    setImageSrc(objectUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(DEFAULT_ZOOM);
    setMinZoom(DEFAULT_ZOOM);
    setCroppedAreaPixels(null);
    setError(null);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [open, sourceFile]);

  const handleMediaLoaded = (mediaSize: MediaSize) => {
    const nextMinZoom = computeContainZoom(mediaSize, preset.aspect);
    setMinZoom(nextMinZoom);
    setZoom((current) => Math.max(current, nextMinZoom));
  };

  const handleCropComplete = (_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  };

  const handleConfirm = async () => {
    if (!sourceFile || !croppedAreaPixels) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const blob = await cropImageToBlob(sourceFile, croppedAreaPixels, {
        width: preset.outputWidth,
        height: preset.outputHeight,
        mimeType: preset.outputMimeType,
        quality: preset.outputQuality,
      });
      const croppedFile = buildCroppedFile(sourceFile, blob, preset.outputMimeType);
      onCropConfirm(croppedFile);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to crop image';
      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onClose={processing ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title ?? `Crop ${preset.label}`}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: 320,
              backgroundColor: 'grey.900',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={preset.aspect}
                minZoom={minZoom}
                maxZoom={MAX_ZOOM}
                restrictPosition={false}
                showGrid
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
                onMediaLoaded={handleMediaLoaded}
              />
            )}
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Zoom
            </Typography>
            <Slider
              value={zoom}
              min={minZoom}
              max={MAX_ZOOM}
              step={ZOOM_STEP}
              onChange={(_event, value) => setZoom(typeof value === 'number' ? value : value[0])}
              aria-label="Zoom"
            />
            <Typography variant="caption" color="text.secondary">
              Drag to reposition. Zoom out to fit the entire image, or zoom in to crop a detail.
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Output: {preset.outputWidth}×{preset.outputHeight} pixels
          </Typography>
          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={processing}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={processing || !croppedAreaPixels || !sourceFile}
          startIcon={processing ? <CircularProgress size={18} /> : undefined}
        >
          {processing ? 'Cropping…' : 'Apply Crop'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageCropDialog;
