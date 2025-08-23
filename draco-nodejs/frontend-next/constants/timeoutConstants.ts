/**
 * Timeout Constants for Frontend Components
 * Centralizes all timeout and duration values used across the frontend application
 */

/**
 * Loading and UI timeout constants
 */
export const UI_TIMEOUTS = {
  /** Loading timeout for page data fetching (5 seconds) - prevents flashing on fast page changes */
  LOADING_DISPLAY_TIMEOUT_MS: 5000,

  /** Hint display timeout for pagination gestures (5 seconds) */
  PAGINATION_HINT_TIMEOUT_MS: 5000,

  /** Error message display timeout (5 seconds) */
  ERROR_MESSAGE_TIMEOUT_MS: 5000,

  /** Success message display timeout (3 seconds) */
  SUCCESS_MESSAGE_TIMEOUT_MS: 3000,
} as const;

/**
 * Data verification and validation timeouts
 */
export const VERIFICATION_TIMEOUTS = {
  /** Email verification data expiry timeout (5 minutes) */
  EMAIL_VERIFICATION_TIMEOUT_MS: 5 * 60 * 1000,

  /** Access code validation timeout (15 minutes) */
  ACCESS_CODE_BLOCK_DURATION_MS: 15 * 60 * 1000,

  /** Cache TTL for batch queries (5 minutes) */
  CACHE_TTL_MS: 5 * 60 * 1000,
} as const;

/**
 * API request timeouts
 */
export const API_TIMEOUTS = {
  /** Standard API request timeout (30 seconds) */
  STANDARD_REQUEST_TIMEOUT_MS: 30 * 1000,

  /** Long-running operation timeout (2 minutes) */
  LONG_OPERATION_TIMEOUT_MS: 2 * 60 * 1000,

  /** File upload timeout (5 minutes) */
  FILE_UPLOAD_TIMEOUT_MS: 5 * 60 * 1000,
} as const;

/**
 * Component-specific timeouts
 */
export const COMPONENT_TIMEOUTS = {
  /** Team roster management loading timeout (15 seconds) */
  TEAM_ROSTER_LOADING_TIMEOUT_MS: 15000,

  /** Email scheduling minimum time offset (5 minutes from now) */
  EMAIL_SCHEDULE_MIN_OFFSET_MS: 5 * 60 * 1000,
} as const;

/**
 * Rate limiting timeouts
 */
export const RATE_LIMIT_TIMEOUTS = {
  /** Standard rate limit window (15 minutes) */
  STANDARD_WINDOW_MS: 15 * 60 * 1000,

  /** Authentication rate limit window (1 hour) */
  AUTH_WINDOW_MS: 60 * 60 * 1000,

  /** Password reset rate limit window (24 hours) */
  PASSWORD_RESET_WINDOW_MS: 24 * 60 * 60 * 1000,
} as const;

/**
 * Performance monitoring timeouts
 */
export const PERFORMANCE_TIMEOUTS = {
  /** Performance stats collection window (5 minutes) */
  STATS_COLLECTION_WINDOW_MS: 5 * 60 * 1000,

  /** Maximum time allowed for security tests (5 seconds) */
  SECURITY_TEST_MAX_TIME_MS: 5000,
} as const;
