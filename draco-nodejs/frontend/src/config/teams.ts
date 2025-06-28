// Team configuration settings
export const TEAM_CONFIG = {
  // Logo configuration
  LOGO_SIZE: 60, // Size in pixels for team logos (width and height)
  LOGO_MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  LOGO_ACCEPTED_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],

  // Storage configuration
  STORAGE_PROVIDER: process.env.REACT_APP_STORAGE_PROVIDER || "local", // "local" or "s3"
  S3_ENDPOINT: process.env.REACT_APP_S3_ENDPOINT || "http://localhost:4566", // LocalStack endpoint
  S3_BUCKET: process.env.REACT_APP_S3_BUCKET || "draco-team-logos",

  // Display configuration
  TEAMS_PER_ROW: {
    xs: 1, // Extra small screens
    sm: 2, // Small screens
    md: 3, // Medium screens
    lg: 4, // Large screens
    xl: 5, // Extra large screens
  },
};

// Helper function to get logo size
export const getLogoSize = (): number => {
  return TEAM_CONFIG.LOGO_SIZE;
};

// Helper function to generate logo URL based on storage provider
export const getLogoUrl = (accountId: string, teamId: string, seasonId: string, teamSeasonId: string, timestamp?: number): string => {
  const cacheBuster = timestamp || Date.now();
  
  if (TEAM_CONFIG.STORAGE_PROVIDER === "s3") {
    // For S3, we'll use a backend proxy endpoint to serve the images
    return `/api/accounts/${accountId}/seasons/${seasonId}/teams/${teamSeasonId}/logo?t=${cacheBuster}`;
  } else {
    // For local storage, use the direct uploads path
    return `/uploads/${accountId}/team-logos/${teamId}-logo.png?t=${cacheBuster}`;
  }
};

// Helper function to validate logo file
export const validateLogoFile = (file: File): string | null => {
  if (!TEAM_CONFIG.LOGO_ACCEPTED_TYPES.includes(file.type)) {
    return "Please select a valid image file (JPEG, PNG, GIF, or WebP)";
  }

  if (file.size > TEAM_CONFIG.LOGO_MAX_FILE_SIZE) {
    return `Image file size must be less than ${TEAM_CONFIG.LOGO_MAX_FILE_SIZE / (1024 * 1024)}MB`;
  }

  return null;
};
