// Logo configuration settings
export const LOGO_CONFIG = {
  // Upload limits
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB max upload size
  MAX_UPLOAD_DIMENSIONS: 2048, // Max width/height for upload (reject if larger)

  // Display settings
  DISPLAY_SIZE: 60, // 60x60 pixels for display
  QUALITY: 85, // JPEG quality for resized images

  // Accepted formats
  ACCEPTED_FORMATS: ["jpg", "jpeg", "png", "gif", "webp"],
  ACCEPTED_MIME_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],

  // Storage settings
  OUTPUT_FORMAT: "png", // Always save as PNG for consistency
  STORAGE_PATH: "uploads", // Base path for file storage
};

// Helper function to validate logo file
export const validateLogoFile = (file: Express.Multer.File): string | null => {
  // Check file size
  if (file.size > LOGO_CONFIG.MAX_UPLOAD_SIZE) {
    return `File size must be less than ${LOGO_CONFIG.MAX_UPLOAD_SIZE / (1024 * 1024)}MB`;
  }

  // Check file type
  if (!LOGO_CONFIG.ACCEPTED_MIME_TYPES.includes(file.mimetype)) {
    return `File type not supported. Accepted formats: ${LOGO_CONFIG.ACCEPTED_FORMATS.join(", ")}`;
  }

  return null;
};

// Helper function to generate logo path
export const generateLogoPath = (accountId: string, teamId: string): string => {
  return `${LOGO_CONFIG.STORAGE_PATH}/${accountId}/team-logos/${teamId}-logo.${LOGO_CONFIG.OUTPUT_FORMAT}`;
};
