import type { PhotoGalleryPhotoType } from '@draco/shared-schemas';

export const PHOTO_GALLERY_THUMBNAIL_DIMENSIONS = { width: 160, height: 90 } as const;

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

export const getPhotoThumbnailSrc = (photo: PhotoGalleryPhotoType): string =>
  photo.thumbnailUrl ?? photo.primaryUrl ?? photo.originalUrl;
