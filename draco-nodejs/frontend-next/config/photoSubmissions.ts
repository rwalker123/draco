export const PHOTO_SUBMISSION_CONFIG = {
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: ['image/gif', 'image/jpeg', 'image/png', 'image/bmp'],
  ALLOWED_EXTENSIONS: ['.gif', '.jpg', '.jpeg', '.png', '.bmp'],
};

const normalizeExtension = (fileName: string): string => {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) {
    return '';
  }
  return fileName.slice(lastDot).toLowerCase();
};

export const validatePhotoSubmissionFile = (file: File | null): string | null => {
  if (!file) {
    return 'Please choose a photo to upload.';
  }

  const extension = normalizeExtension(file.name);
  const hasAllowedExtension = PHOTO_SUBMISSION_CONFIG.ALLOWED_EXTENSIONS.includes(extension);

  const normalizedType = file.type?.toLowerCase() ?? '';
  const hasAllowedMimeType =
    normalizedType.length === 0 ||
    PHOTO_SUBMISSION_CONFIG.ALLOWED_MIME_TYPES.includes(normalizedType);

  if (!hasAllowedExtension && !hasAllowedMimeType) {
    return 'Only GIF, JPG, JPEG, PNG, or BMP images are supported.';
  }

  if (file.size > PHOTO_SUBMISSION_CONFIG.MAX_FILE_SIZE_BYTES) {
    const maxMegabytes = PHOTO_SUBMISSION_CONFIG.MAX_FILE_SIZE_BYTES / (1024 * 1024);
    return `Images must be smaller than ${maxMegabytes}MB.`;
  }

  return null;
};
