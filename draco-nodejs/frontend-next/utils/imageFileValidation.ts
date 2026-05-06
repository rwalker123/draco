export interface ImageFileValidationConfig {
  allowedMimeTypes: readonly string[];
  allowedExtensions: readonly string[];
  maxFileSizeBytes: number;
  formatLabel: string;
}

const normalizeExtension = (fileName: string): string => {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) {
    return '';
  }
  return fileName.slice(lastDot).toLowerCase();
};

export const validateImageFile = (
  file: File | null,
  config: ImageFileValidationConfig,
): string | null => {
  if (!file) {
    return 'Please choose an image to upload.';
  }

  const extension = normalizeExtension(file.name);
  const hasAllowedExtension = config.allowedExtensions.includes(extension);

  const normalizedType = file.type?.toLowerCase() ?? '';
  const hasAllowedMimeType =
    normalizedType.length === 0 || config.allowedMimeTypes.includes(normalizedType);

  if (!hasAllowedExtension || !hasAllowedMimeType) {
    return `Only ${config.formatLabel} images are supported.`;
  }

  if (file.size > config.maxFileSizeBytes) {
    const maxMegabytes = config.maxFileSizeBytes / (1024 * 1024);
    return `Images must be smaller than ${maxMegabytes}MB.`;
  }

  return null;
};

export const GALLERY_PHOTO_UPLOAD_CONFIG: ImageFileValidationConfig = {
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  maxFileSizeBytes: 10 * 1024 * 1024,
  formatLabel: 'JPG, JPEG, PNG, or WebP',
};

export const ACCOUNT_LOGO_UPLOAD_CONFIG: ImageFileValidationConfig = {
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  maxFileSizeBytes: 10 * 1024 * 1024,
  formatLabel: 'JPG, JPEG, PNG, GIF, or WebP',
};

export const SPONSOR_PHOTO_UPLOAD_CONFIG: ImageFileValidationConfig = {
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  maxFileSizeBytes: 10 * 1024 * 1024,
  formatLabel: 'JPG, JPEG, PNG, GIF, or WebP',
};

export const CONTACT_PHOTO_UPLOAD_CONFIG: ImageFileValidationConfig = {
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  maxFileSizeBytes: 10 * 1024 * 1024,
  formatLabel: 'JPG, JPEG, PNG, GIF, or WebP',
};
