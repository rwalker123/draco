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
    require_tld: true
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

/**
 * Gets a user-friendly error message for URL validation
 * @param url - The URL that failed validation
 * @returns A helpful error message
 */
export const getUrlValidationError = (url: string): string => {
  if (!url.trim()) {
    return 'URL is required';
  }
  
  if (!url.includes('://')) {
    return 'URL must include protocol (http:// or https://)';
  }
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'URL must start with http:// or https://';
  }
  
  if (!isValidAccountUrl(url)) {
    return 'Invalid URL format. Please use http:// or https:// followed by a valid domain.';
  }
  
  return 'Invalid URL format';
};

/**
 * Validates a domain string (without protocol) using validator.js
 * @param domain - The domain to validate
 * @returns true if valid, false otherwise
 */
export const isValidDomain = (domain: string): boolean => {
  if (!domain.trim()) {
    return false;
  }
  
  // Remove any protocol if accidentally included
  const cleanDomain = domain.replace(/^https?:\/\//, '');
  
  // Use validator.js isFQDN (Fully Qualified Domain Name) for basic format validation
  if (!validator.isFQDN(cleanDomain, {
    require_tld: true,
    allow_underscores: false,
    allow_trailing_dot: false,
    allow_numeric_tld: false
  })) {
    return false;
  }
  
  // Additional validation: Check if TLD looks reasonable
  const parts = cleanDomain.split('.');
  const tld = parts[parts.length - 1].toLowerCase();
  
  // Common TLDs (this is not exhaustive but covers most cases)
  const commonTlds = [
    'com', 'org', 'net', 'edu', 'gov', 'mil', 'int',
    'co', 'io', 'ai', 'app', 'dev', 'tech', 'online', 'site', 'web',
    'us', 'uk', 'ca', 'au', 'de', 'fr', 'it', 'es', 'nl', 'se', 'no', 'dk', 'fi',
    'jp', 'cn', 'in', 'br', 'mx', 'ar', 'cl', 'pe', 'co', 've', 'ec',
    'za', 'ng', 'ke', 'gh', 'ug', 'tz', 'zm', 'zw',
    'ru', 'ua', 'pl', 'cz', 'hu', 'ro', 'bg', 'hr', 'si', 'sk', 'ee', 'lv', 'lt',
    'my', 'sg', 'th', 'vn', 'ph', 'id', 'pk', 'bd', 'lk', 'np',
    'info', 'biz', 'name', 'pro', 'aero', 'coop', 'museum', 'jobs', 'mobi', 'travel'
  ];
  
  // Check if TLD is in our list of common TLDs
  if (!commonTlds.includes(tld)) {
    return false;
  }
  
  return true;
};

/**
 * Gets a user-friendly error message for domain validation
 * @param domain - The domain that failed validation
 * @returns A helpful error message
 */
export const getDomainValidationError = (domain: string): string => {
  if (!domain.trim()) {
    return 'Domain is required';
  }
  
  // Remove any protocol if accidentally included
  const cleanDomain = domain.replace(/^https?:\/\//, '');
  
  if (cleanDomain.includes('://')) {
    return 'Please enter only the domain name (e.g., example.com) without the protocol';
  }
  
  if (cleanDomain.includes(' ')) {
    return 'Domain cannot contain spaces';
  }
  
  // Check if it's a valid FQDN format first
  if (!validator.isFQDN(cleanDomain, {
    require_tld: true,
    allow_underscores: false,
    allow_trailing_dot: false,
    allow_numeric_tld: false
  })) {
    return 'Please enter a valid domain name (e.g., example.com, www.example.com)';
  }
  
  // Check if TLD is valid
  const parts = cleanDomain.split('.');
  const tld = parts[parts.length - 1].toLowerCase();
  
  const commonTlds = [
    'com', 'org', 'net', 'edu', 'gov', 'mil', 'int',
    'co', 'io', 'ai', 'app', 'dev', 'tech', 'online', 'site', 'web',
    'us', 'uk', 'ca', 'au', 'de', 'fr', 'it', 'es', 'nl', 'se', 'no', 'dk', 'fi',
    'jp', 'cn', 'in', 'br', 'mx', 'ar', 'cl', 'pe', 'co', 've', 'ec',
    'za', 'ng', 'ke', 'gh', 'ug', 'tz', 'zm', 'zw',
    'ru', 'ua', 'pl', 'cz', 'hu', 'ro', 'bg', 'hr', 'si', 'sk', 'ee', 'lv', 'lt',
    'my', 'sg', 'th', 'vn', 'ph', 'id', 'pk', 'bd', 'lk', 'np',
    'info', 'biz', 'name', 'pro', 'aero', 'coop', 'museum', 'jobs', 'mobi', 'travel'
  ];
  
  if (!commonTlds.includes(tld)) {
    return `"${tld}" is not a recognized top-level domain. Please use a valid TLD like .com, .org, .net, etc.`;
  }
  
  return 'Invalid domain format';
}; 