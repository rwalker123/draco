// Logo configuration settings
export const LOGO_CONFIG = {
  // Upload limits
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB max upload size
  MAX_UPLOAD_DIMENSIONS: 2048, // Max width/height for upload (reject if larger)

  // Display settings
  DISPLAY_SIZE: 60, // 60x60 pixels for display
  QUALITY: 85, // JPEG quality for resized images

  // Accepted formats
  ACCEPTED_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  ACCEPTED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],

  // Storage settings
  OUTPUT_FORMAT: 'png', // Always save as PNG for consistency
  STORAGE_PATH: 'uploads', // Base path for file storage
};

// Helper function to validate logo file
export const validateLogoFile = (file: Express.Multer.File): string | null => {
  // Check file size
  if (file.size > LOGO_CONFIG.MAX_UPLOAD_SIZE) {
    return `File size must be less than ${LOGO_CONFIG.MAX_UPLOAD_SIZE / (1024 * 1024)}MB`;
  }

  // Check file type
  if (!LOGO_CONFIG.ACCEPTED_MIME_TYPES.includes(file.mimetype)) {
    return `File type not supported. Accepted formats: ${LOGO_CONFIG.ACCEPTED_FORMATS.join(', ')}`;
  }

  return null;
};

// Helper function to generate logo path
export const generateLogoPath = (accountId: string, teamId: string): string => {
  return `${LOGO_CONFIG.STORAGE_PATH}/${accountId}/team-logos/${teamId}-logo.${LOGO_CONFIG.OUTPUT_FORMAT}`;
};

export const getLogoUrl = (accountId: string | number, teamId: string | number): string => {
  if (process.env.STORAGE_PROVIDER === 's3') {
    if (!process.env.S3_BUCKET) {
      throw new Error('S3_BUCKET environment variable must be set for S3 storage');
    }
    const bucket = process.env.S3_BUCKET;
    const region = process.env.S3_REGION || 'us-east-1';
    const s3Endpoint = process.env.S3_ENDPOINT || '';

    if (s3Endpoint.includes('localhost')) {
      // LocalStack style URL
      const endpoint = s3Endpoint.replace(/^https?:\/\//, '');
      return `http://${endpoint}/${bucket}/${accountId}/team-logos/${teamId}-logo.png`;
    } else {
      // AWS S3 style URL
      return `https://${bucket}.s3.${region}.amazonaws.com/${accountId}/team-logos/${teamId}-logo.png`;
    }
  } else {
    // Local storage
    return `/${generateLogoPath(accountId.toString(), teamId.toString())}`;
  }
};

// Account logo settings
export const ACCOUNT_LOGO_CONFIG = {
  WIDTH: 512,
  HEIGHT: 125,
  OUTPUT_FORMAT: 'png',
  STORAGE_PATH: 'uploads',
};

export const generateAccountLogoPath = (accountId: string): string => {
  return `${ACCOUNT_LOGO_CONFIG.STORAGE_PATH}/${accountId}/logo.${ACCOUNT_LOGO_CONFIG.OUTPUT_FORMAT}`;
};

export const getAccountLogoUrl = (accountId: string | number): string => {
  if (process.env.STORAGE_PROVIDER === 's3') {
    if (!process.env.S3_BUCKET) {
      throw new Error('S3_BUCKET environment variable must be set for S3 storage');
    }
    const bucket = process.env.S3_BUCKET;
    const region = process.env.S3_REGION || 'us-east-1';
    const s3Endpoint = process.env.S3_ENDPOINT || '';
    if (s3Endpoint.includes('localhost')) {
      // LocalStack style URL
      const endpoint = s3Endpoint.replace(/^https?:\/\//, '');
      return `http://${endpoint}/${bucket}/${accountId}/logo.png`;
    } else {
      // AWS S3 style URL
      return `https://${bucket}.s3.${region}.amazonaws.com/${accountId}/logo.png`;
    }
  } else {
    // Local storage
    return `/${generateAccountLogoPath(accountId.toString())}`;
  }
};

// Contact photo settings
export const CONTACT_PHOTO_CONFIG = {
  WIDTH: 150,
  HEIGHT: 150,
  OUTPUT_FORMAT: 'png',
  STORAGE_PATH: 'uploads',
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB max upload size
  ACCEPTED_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  ACCEPTED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  QUALITY: 85, // JPEG quality for resized images
};

// Helper function to validate contact photo file
export const validateContactPhotoFile = (file: Express.Multer.File): string | null => {
  // Check file size
  if (file.size > CONTACT_PHOTO_CONFIG.MAX_UPLOAD_SIZE) {
    return `File size must be less than ${CONTACT_PHOTO_CONFIG.MAX_UPLOAD_SIZE / (1024 * 1024)}MB`;
  }

  // Check file type
  if (!CONTACT_PHOTO_CONFIG.ACCEPTED_MIME_TYPES.includes(file.mimetype)) {
    return `File type not supported. Accepted formats: ${CONTACT_PHOTO_CONFIG.ACCEPTED_FORMATS.join(', ')}`;
  }

  return null;
};

// Helper function to generate contact photo path
export const generateContactPhotoPath = (accountId: string, contactId: string): string => {
  return `${CONTACT_PHOTO_CONFIG.STORAGE_PATH}/${accountId}/contact-photos/${contactId}-photo.${CONTACT_PHOTO_CONFIG.OUTPUT_FORMAT}`;
};

export const getContactPhotoUrl = (
  accountId: string | number,
  contactId: string | number,
): string => {
  if (process.env.STORAGE_PROVIDER === 's3') {
    if (!process.env.S3_BUCKET) {
      throw new Error('S3_BUCKET environment variable must be set for S3 storage');
    }
    const bucket = process.env.S3_BUCKET;
    const region = process.env.S3_REGION || 'us-east-1';
    const s3Endpoint = process.env.S3_ENDPOINT || '';

    if (s3Endpoint.includes('localhost')) {
      // LocalStack style URL
      const endpoint = s3Endpoint.replace(/^https?:\/\//, '');
      return `http://${endpoint}/${bucket}/${accountId}/contact-photos/${contactId}-photo.png`;
    } else {
      // AWS S3 style URL
      return `https://${bucket}.s3.${region}.amazonaws.com/${accountId}/contact-photos/${contactId}-photo.png`;
    }
  } else {
    // Local storage
    return `/${generateContactPhotoPath(accountId.toString(), contactId.toString())}`;
  }
};

export const SPONSOR_PHOTO_CONFIG = {
  WIDTH: 300,
  HEIGHT: 150,
  OUTPUT_FORMAT: 'png',
  STORAGE_PATH: 'uploads',
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024,
  ACCEPTED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
};

export const validateSponsorPhotoFile = (file: Express.Multer.File): string | null => {
  if (file.size > SPONSOR_PHOTO_CONFIG.MAX_UPLOAD_SIZE) {
    return `File size must be less than ${SPONSOR_PHOTO_CONFIG.MAX_UPLOAD_SIZE / (1024 * 1024)}MB`;
  }

  if (!SPONSOR_PHOTO_CONFIG.ACCEPTED_MIME_TYPES.includes(file.mimetype)) {
    return 'Invalid file type for sponsor photo';
  }

  return null;
};

export const generateSponsorPhotoPath = (accountId: string, sponsorId: string): string => {
  return `${SPONSOR_PHOTO_CONFIG.STORAGE_PATH}/${accountId}/sponsor-photos/${sponsorId}-photo.${SPONSOR_PHOTO_CONFIG.OUTPUT_FORMAT}`;
};

export const getSponsorPhotoUrl = (accountId: string | number, sponsorId: string | number): string => {
  if (process.env.STORAGE_PROVIDER === 's3') {
    if (!process.env.S3_BUCKET) {
      throw new Error('S3_BUCKET environment variable must be set for S3 storage');
    }
    const bucket = process.env.S3_BUCKET;
    const region = process.env.S3_REGION || 'us-east-1';
    const s3Endpoint = process.env.S3_ENDPOINT || '';

    if (s3Endpoint.includes('localhost')) {
      const endpoint = s3Endpoint.replace(/^https?:\/\//, '');
      return `http://${endpoint}/${bucket}/${accountId}/sponsor-photos/${sponsorId}-photo.png`;
    }

    return `https://${bucket}.s3.${region}.amazonaws.com/${accountId}/sponsor-photos/${sponsorId}-photo.png`;
  }

  return `/${generateSponsorPhotoPath(accountId.toString(), sponsorId.toString())}`;
};
