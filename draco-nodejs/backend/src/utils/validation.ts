import validator from 'validator';

/**
 * Validates a URL with strict requirements for account URLs
 * @param url - The URL to validate
 * @returns true if valid, false otherwise
 */
export const isValidAccountUrl = (url: string): boolean => {
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true,
    allow_underscores: false,
    allow_trailing_dot: false,
    allow_protocol_relative_urls: false,
    require_host: true,
    require_port: false,
    require_tld: true,
  });
};

/**
 * Normalizes a URL for storage (lowercase, trim whitespace)
 * @param url - The URL to normalize
 * @returns The normalized URL
 */
export const normalizeUrl = (url: string): string => {
  return url.toLowerCase().trim();
};

/**
 * Validates and normalizes a URL for account use
 * @param url - The URL to validate and normalize
 * @returns The normalized URL if valid, null if invalid
 */
export const validateAndNormalizeUrl = (url: string): string | null => {
  if (!isValidAccountUrl(url)) {
    return null;
  }
  return normalizeUrl(url);
};
