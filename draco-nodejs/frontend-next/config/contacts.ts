import { addCacheBuster as addCacheBusterUtil } from '../utils/addCacheBuster';

// Contact configuration settings
export const CONTACT_CONFIG = {
  // Photo configuration
  PHOTO_SIZE: 150, // Size in pixels for contact photos (width and height)
  PHOTO_MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  PHOTO_ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],

  // Display configuration
  CONTACTS_PER_ROW: {
    xs: 1, // Extra small screens
    sm: 2, // Small screens
    md: 3, // Medium screens
    lg: 4, // Large screens
    xl: 5, // Extra large screens
  },
};

// Helper function to get photo size
export const getPhotoSize = (): number => {
  return CONTACT_CONFIG.PHOTO_SIZE;
};

// Helper function to add cache-buster to a URL
export const addCacheBuster = (url: string, timestamp?: number): string => {
  return addCacheBusterUtil(url, timestamp) ?? url;
};

// Helper function to validate contact photo file
export const validateContactPhotoFile = (file: File): string | null => {
  if (!CONTACT_CONFIG.PHOTO_ACCEPTED_TYPES.includes(file.type)) {
    return 'Please select a valid image file (JPEG, PNG, GIF, or WebP)';
  }

  if (file.size > CONTACT_CONFIG.PHOTO_MAX_FILE_SIZE) {
    return `Image file size must be less than ${CONTACT_CONFIG.PHOTO_MAX_FILE_SIZE / (1024 * 1024)}MB`;
  }

  return null;
};
