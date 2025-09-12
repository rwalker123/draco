/**
 * Error type definitions and categorization for Draco Sports Manager
 * 
 * This module provides a structured error system with:
 * - Error categories for different types of failures
 * - Standardized error codes
 * - Structured error information
 * - Type-safe error handling
 */

/**
 * Error categories for classifying different types of failures
 */
export enum ErrorCategory {
  /** Network connectivity issues, DNS failures, connection timeouts */
  NETWORK = 'NETWORK',
  /** Authentication failures, invalid tokens, login required */
  AUTHENTICATION = 'AUTHENTICATION',
  /** Authorization failures, insufficient permissions, forbidden access */
  AUTHORIZATION = 'AUTHORIZATION',
  /** Request validation failures, invalid data format, missing fields */
  VALIDATION = 'VALIDATION',
  /** Server-side errors, 5xx status codes, internal failures */
  SERVER_ERROR = 'SERVER_ERROR',
  /** Client-side errors, 4xx status codes (excluding auth) */
  CLIENT_ERROR = 'CLIENT_ERROR',
  /** Request timeout, slow response */
  TIMEOUT = 'TIMEOUT',
  /** Rate limiting, too many requests */
  RATE_LIMIT = 'RATE_LIMIT',
  /** Unknown or unclassified errors */
  UNKNOWN = 'UNKNOWN'
}

/**
 * Standard error codes used throughout the application
 * These codes provide machine-readable error identification
 */
export const ErrorCodes = {
  // Authentication errors
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_MISSING: 'AUTH_TOKEN_MISSING',
  AUTH_LOGIN_FAILED: 'AUTH_LOGIN_FAILED',
  AUTH_REFRESH_FAILED: 'AUTH_REFRESH_FAILED',

  // Authorization errors
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  ACCOUNT_ACCESS_DENIED: 'ACCOUNT_ACCESS_DENIED',
  ROLE_INSUFFICIENT: 'ROLE_INSUFFICIENT',

  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  VALIDATION_FIELD_REQUIRED: 'VALIDATION_FIELD_REQUIRED',
  VALIDATION_FIELD_INVALID: 'VALIDATION_FIELD_INVALID',
  VALIDATION_FORMAT_INVALID: 'VALIDATION_FORMAT_INVALID',

  // Resource errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',

  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_CONNECTION_FAILED: 'NETWORK_CONNECTION_FAILED',

  // Server errors
  SERVER_ERROR: 'SERVER_ERROR',
  SERVER_UNAVAILABLE: 'SERVER_UNAVAILABLE',
  SERVER_MAINTENANCE: 'SERVER_MAINTENANCE',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // File operations
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  FILE_SIZE_EXCEEDED: 'FILE_SIZE_EXCEEDED',
  FILE_TYPE_INVALID: 'FILE_TYPE_INVALID',

  // Account-specific errors
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  SEASON_NOT_FOUND: 'SEASON_NOT_FOUND',

  // Unknown
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',

  // JSON parsing error of responses
  RESPONSE_PROCESSING_ERROR: 'RESPONSE_PROCESSING_ERROR'
} as const;

/**
 * Type for error codes - ensures only valid codes are used
 */
export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Structured error information
 * Provides detailed error context for debugging and user feedback
 */
export interface ApiError {
  /** Always false to indicate error state */
  success: false;
  /** Machine-readable error code */
  errorCode: ErrorCode;
  /** Human-readable error message */
  errorMessage: string;
  /** HTTP status code */
  statusCode: number;
  /** Error category for classification */
  category: ErrorCategory;
  /** Whether the error is retryable */
  retryable: boolean;
  /** Additional error context and debugging information */
  details?: Record<string, unknown>;
  /** Original error that caused this error (for debugging) */
  cause?: unknown;
  /** Timestamp when the error occurred */
  timestamp?: Date;
}

/**
 * Validation error details
 * Specific structure for validation failures
 */
export interface ValidationError {
  /** Field name that failed validation */
  field: string;
  /** Validation error message for this field */
  message: string;
  /** Value that failed validation */
  value?: unknown;
  /** Validation rule that was violated */
  rule?: string;
}

/**
 * Extended API error for validation failures
 * Includes detailed field-level validation errors
 */
export interface ValidationApiError extends Omit<ApiError, 'details'> {
  /** Always VALIDATION for validation errors */
  category: ErrorCategory.VALIDATION;
  /** Always VALIDATION_FAILED for validation errors */
  errorCode: typeof ErrorCodes.VALIDATION_FAILED;
  /** Detailed validation errors for each field */
  details: {
    /** Array of field-specific validation errors */
    validationErrors: ValidationError[];
    /** Additional context if needed */
    [key: string]: unknown;
  };
}

/**
 * Error mapping for HTTP status codes to error categories
 */
export const StatusCodeToCategory: Record<number, ErrorCategory> = {
  // 4xx Client Errors
  400: ErrorCategory.VALIDATION,
  401: ErrorCategory.AUTHENTICATION,
  403: ErrorCategory.AUTHORIZATION,
  404: ErrorCategory.CLIENT_ERROR,
  409: ErrorCategory.CLIENT_ERROR,
  422: ErrorCategory.VALIDATION,
  429: ErrorCategory.RATE_LIMIT,

  // 5xx Server Errors
  500: ErrorCategory.SERVER_ERROR,
  502: ErrorCategory.SERVER_ERROR,
  503: ErrorCategory.SERVER_ERROR,
  504: ErrorCategory.TIMEOUT
};

/**
 * Helper function to determine if an error is retryable based on category and code
 */
export function isRetryableError(error: ApiError): boolean {
  // Network errors are generally retryable
  if (error.category === ErrorCategory.NETWORK) {
    return true;
  }

  // Timeout errors are retryable
  if (error.category === ErrorCategory.TIMEOUT) {
    return true;
  }

  // Some server errors are retryable
  if (error.category === ErrorCategory.SERVER_ERROR) {
    const retryableServerErrors: ErrorCode[] = [
      ErrorCodes.SERVER_UNAVAILABLE,
      ErrorCodes.SERVER_MAINTENANCE
    ];
    return retryableServerErrors.includes(error.errorCode);
  }

  // Rate limit errors are retryable (with backoff)
  if (error.category === ErrorCategory.RATE_LIMIT) {
    return true;
  }

  // Authentication errors might be retryable if token can be refreshed
  if (error.category === ErrorCategory.AUTHENTICATION) {
    return error.errorCode === ErrorCodes.AUTH_TOKEN_EXPIRED;
  }

  // Default to not retryable for safety
  return false;
}

/**
 * Helper function to get recommended retry delay in milliseconds
 */
export function getRetryDelay(error: ApiError, attemptNumber: number): number {
  // Exponential backoff with jitter
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  
  let delay = Math.min(baseDelay * Math.pow(2, attemptNumber - 1), maxDelay);
  
  // Add jitter to avoid thundering herd
  delay += Math.random() * 1000;
  
  // Special cases
  if (error.category === ErrorCategory.RATE_LIMIT) {
    // Longer delay for rate limiting
    delay = Math.min(delay * 2, 60000);
  }
  
  return Math.floor(delay);
}