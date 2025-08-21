// Access Code Validation Utilities
// Centralized validation for access codes with security features

import { IAccessCodeValidationResult, IAccessCodeRateLimitInfo } from '../types/accessCode';

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

// UUID validation regex (RFC 4122 compliant)
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Access code length constants
export const ACCESS_CODE_LENGTH = 36; // UUID format: 8-4-4-4-12
export const ACCESS_CODE_MIN_LENGTH = 32; // Minimum length for partial validation

// Rate limiting constants
export const RATE_LIMIT_CONFIG = {
  maxAttempts: 5,
  blockDuration: 15 * 60 * 1000, // 15 minutes in milliseconds
  resetInterval: 60 * 60 * 1000, // 1 hour in milliseconds
} as const;

// ============================================================================
// CORE VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate access code format and sanitize input
 * @param accessCode - The access code to validate
 * @returns Validation result with sanitized value if valid
 */
export const validateAccessCode = (accessCode: string): IAccessCodeValidationResult => {
  // Basic input validation
  if (!accessCode || typeof accessCode !== 'string') {
    return {
      isValid: false,
      error: 'Access code is required',
    };
  }

  const trimmedCode = accessCode.trim();

  if (trimmedCode.length === 0) {
    return {
      isValid: false,
      error: 'Access code cannot be empty',
    };
  }

  // Length validation
  if (trimmedCode.length !== ACCESS_CODE_LENGTH) {
    return {
      isValid: false,
      error: `Access code must be exactly ${ACCESS_CODE_LENGTH} characters long`,
    };
  }

  // Format validation using UUID regex
  if (!UUID_REGEX.test(trimmedCode)) {
    return {
      isValid: false,
      error:
        'Access code must be in valid UUID format (e.g., 123e4567-e89b-12d3-a456-426614174000)',
    };
  }

  // Additional format checks for UUID version and variant
  const parts = trimmedCode.split('-');
  if (parts.length !== 5) {
    return {
      isValid: false,
      error: 'Access code format is invalid',
    };
  }

  // Validate UUID version (should be 4 for random UUIDs)
  const version = parseInt(parts[1].substring(0, 1), 16);
  if (version !== 4) {
    return {
      isValid: false,
      error: 'Access code format is invalid (unsupported UUID version)',
    };
  }

  // Validate UUID variant (should be RFC 4122 compliant)
  const variant = parseInt(parts[3].substring(0, 1), 16);
  if (variant < 8 || variant > 11) {
    return {
      isValid: false,
      error: 'Access code format is invalid (unsupported UUID variant)',
    };
  }

  return {
    isValid: true,
    sanitizedValue: trimmedCode.toLowerCase(), // Normalize to lowercase
  };
};

/**
 * Validate access code with partial input support (for real-time validation)
 * @param accessCode - The partial access code to validate
 * @returns Validation result indicating if input is on the right track
 */
export const validatePartialAccessCode = (accessCode: string): IAccessCodeValidationResult => {
  if (!accessCode || typeof accessCode !== 'string') {
    return {
      isValid: false,
      error: 'Access code is required',
    };
  }

  const trimmedCode = accessCode.trim();

  if (trimmedCode.length === 0) {
    return {
      isValid: false,
      error: 'Access code is required',
    };
  }

  if (trimmedCode.length < ACCESS_CODE_MIN_LENGTH) {
    return {
      isValid: false,
      error: `Access code must be at least ${ACCESS_CODE_MIN_LENGTH} characters long`,
    };
  }

  if (trimmedCode.length > ACCESS_CODE_LENGTH) {
    return {
      isValid: false,
      error: `Access code cannot exceed ${ACCESS_CODE_LENGTH} characters`,
    };
  }

  // Check if the current input follows UUID pattern
  const currentPattern = trimmedCode.replace(/[0-9a-f]/gi, 'x');

  if (currentPattern.length === ACCESS_CODE_LENGTH && !currentPattern.match(/^[x-]+$/)) {
    return {
      isValid: false,
      error: 'Access code contains invalid characters',
    };
  }

  // For partial validation, we're more lenient
  return {
    isValid: false, // Not fully valid yet
    error: undefined,
    sanitizedValue: trimmedCode.toLowerCase(),
  };
};

// ============================================================================
// SANITIZATION FUNCTIONS
// ============================================================================

/**
 * Sanitize access code input by removing invalid characters
 * @param input - Raw input string
 * @returns Sanitized string with only valid UUID characters
 */
export const sanitizeAccessCodeInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove all characters except hex digits and hyphens
  const sanitized = input.replace(/[^0-9a-fA-F-]/g, '');

  // Ensure proper hyphen placement
  const parts = sanitized.split('-');
  if (parts.length === 5) {
    // Format: 8-4-4-4-12
    return parts
      .map((part, index) => {
        const maxLength = index === 0 ? 8 : index === 4 ? 12 : 4;
        return part.slice(0, maxLength);
      })
      .join('-');
  }

  return sanitized;
};

/**
 * Format access code for display (add hyphens if missing)
 * @param accessCode - Raw access code string
 * @returns Formatted access code with proper hyphen placement
 */
export const formatAccessCodeForDisplay = (accessCode: string): string => {
  if (!accessCode || typeof accessCode !== 'string') {
    return '';
  }

  const clean = accessCode.replace(/[^0-9a-fA-F]/g, '');

  if (clean.length !== 32) {
    return accessCode; // Return original if not the right length
  }

  // Format as 8-4-4-4-12
  return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20, 32)}`;
};

// ============================================================================
// RATE LIMITING UTILITIES
// ============================================================================

// In-memory storage for rate limiting (in production, use Redis or similar)
const attemptTracking = new Map<
  string,
  {
    attempts: number;
    lastAttempt: Date;
    isBlocked: boolean;
    blockExpiry?: Date;
  }
>();

/**
 * Check if an account is rate limited
 * @param accountId - The account ID to check
 * @returns Rate limit information
 */
export const checkRateLimit = (accountId: string): IAccessCodeRateLimitInfo => {
  const tracking = attemptTracking.get(accountId);

  if (!tracking) {
    return {
      attemptsRemaining: RATE_LIMIT_CONFIG.maxAttempts,
      resetTime: new Date(Date.now() + RATE_LIMIT_CONFIG.resetInterval),
      isBlocked: false,
    };
  }

  // Check if block has expired
  if (tracking.isBlocked && tracking.blockExpiry && tracking.blockExpiry < new Date()) {
    // Reset block
    tracking.isBlocked = false;
    tracking.attempts = 0;
    tracking.blockExpiry = undefined;
  }

  // Check if currently blocked
  if (tracking.isBlocked) {
    return {
      attemptsRemaining: 0,
      resetTime: tracking.blockExpiry!,
      isBlocked: true,
    };
  }

  // Check if max attempts reached
  if (tracking.attempts >= RATE_LIMIT_CONFIG.maxAttempts) {
    // Block the account
    tracking.isBlocked = true;
    tracking.blockExpiry = new Date(Date.now() + RATE_LIMIT_CONFIG.blockDuration);

    return {
      attemptsRemaining: 0,
      resetTime: tracking.blockExpiry,
      isBlocked: true,
    };
  }

  return {
    attemptsRemaining: RATE_LIMIT_CONFIG.maxAttempts - tracking.attempts,
    resetTime: new Date(Date.now() + RATE_LIMIT_CONFIG.resetInterval),
    isBlocked: false,
  };
};

/**
 * Record an access code verification attempt
 * @param accountId - The account ID
 * @param success - Whether the attempt was successful
 */
export const recordAttempt = (accountId: string, success: boolean): void => {
  const tracking = attemptTracking.get(accountId) || {
    attempts: 0,
    lastAttempt: new Date(),
    isBlocked: false,
  };

  tracking.attempts += 1;
  tracking.lastAttempt = new Date();

  // Reset attempts on success
  if (success) {
    tracking.attempts = 0;
    tracking.isBlocked = false;
    tracking.blockExpiry = undefined;
  }

  attemptTracking.set(accountId, tracking);
};

/**
 * Reset rate limiting for an account (admin function)
 * @param accountId - The account ID to reset
 */
export const resetRateLimit = (accountId: string): void => {
  attemptTracking.delete(accountId);
};

/**
 * Get all rate limit tracking (admin function)
 * @returns Array of rate limit tracking data
 */
export const getAllRateLimitTracking = () => {
  return Array.from(attemptTracking.entries()).map(([accountId, tracking]) => ({
    accountId,
    ...tracking,
  }));
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if a string looks like it could be a valid access code
 * @param input - Input string to check
 * @returns True if input has potential to be valid
 */
export const hasValidAccessCodePotential = (input: string): boolean => {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const trimmed = input.trim();

  // Check length
  if (trimmed.length < ACCESS_CODE_MIN_LENGTH || trimmed.length > ACCESS_CODE_LENGTH) {
    return false;
  }

  // Check if contains only valid characters
  return /^[0-9a-fA-F-]+$/.test(trimmed);
};

/**
 * Get validation progress percentage for partial access codes
 * @param accessCode - Partial access code
 * @returns Progress percentage (0-100)
 */
export const getValidationProgress = (accessCode: string): number => {
  if (!accessCode || typeof accessCode !== 'string') {
    return 0;
  }

  const trimmed = accessCode.trim();
  const progress = Math.min((trimmed.length / ACCESS_CODE_LENGTH) * 100, 100);

  return Math.round(progress);
};
