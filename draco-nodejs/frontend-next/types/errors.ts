/**
 * Standardized Error Types and Interfaces
 * Provides consistent error handling across the application
 */

// Base error interface for all application errors
export interface BaseError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: Date;
  stack?: string;
}

// Email recipient specific error codes
export enum EmailRecipientErrorCode {
  // Network and API errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_TIMEOUT = 'API_TIMEOUT',
  API_UNAVAILABLE = 'API_UNAVAILABLE',
  RATE_LIMITED = 'RATE_LIMITED',

  // Authentication and authorization
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  AUTHENTICATION_EXPIRED = 'AUTHENTICATION_EXPIRED',
  AUTHORIZATION_DENIED = 'AUTHORIZATION_DENIED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Data and validation errors
  INVALID_DATA = 'INVALID_DATA',
  CONTACT_NOT_FOUND = 'CONTACT_NOT_FOUND',
  TEAM_NOT_FOUND = 'TEAM_NOT_FOUND',
  SEASON_NOT_FOUND = 'SEASON_NOT_FOUND',
  VALIDATION_FAILED = 'VALIDATION_FAILED',

  // Service and component errors
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TRANSFORMATION_FAILED = 'TRANSFORMATION_FAILED',
  COMPONENT_CRASHED = 'COMPONENT_CRASHED',
  CACHE_ERROR = 'CACHE_ERROR',

  // Search and filtering errors
  SEARCH_FAILED = 'SEARCH_FAILED',
  FILTER_ERROR = 'FILTER_ERROR',

  // Generic fallback
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Email recipient error with user-friendly messaging
export interface EmailRecipientError extends BaseError {
  code: EmailRecipientErrorCode;
  userMessage: string;
  recoverable: boolean;
  retryable: boolean;
  context?: {
    accountId?: string;
    seasonId?: string;
    contactId?: string;
    teamId?: string;
    query?: string;
    operation?: string;
    additionalData?: Record<string, unknown>;
  };
}

// API error response structure
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    statusCode?: number;
  };
  timestamp: string;
}

// Network error types
export interface NetworkError extends BaseError {
  code: 'NETWORK_ERROR' | 'API_TIMEOUT' | 'API_UNAVAILABLE';
  statusCode?: number;
  endpoint?: string;
  method?: string;
}

// Validation error types
export interface ValidationError extends BaseError {
  code: 'VALIDATION_FAILED';
  field?: string;
  value?: unknown;
  expectedType?: string;
}

// Component error types
export interface ComponentError extends BaseError {
  code: 'COMPONENT_CRASHED';
  componentName: string;
  props?: Record<string, unknown>;
  errorBoundary?: boolean;
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error category for logging and metrics
export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  DATA = 'data',
  COMPONENT = 'component',
  SERVICE = 'service',
  USER = 'user',
}

// Error context for debugging
export interface ErrorContext {
  userId?: string;
  accountId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  operation?: string;
  additionalData?: Record<string, unknown>;
}

// Error reporting payload
export interface ErrorReport {
  error: BaseError;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: ErrorContext;
  userImpact: string;
  reproductionSteps?: string[];
}

// Type guards for error identification
export function isEmailRecipientError(error: unknown): error is EmailRecipientError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'userMessage' in error &&
    'recoverable' in error &&
    'retryable' in error
  );
}

export function isNetworkError(error: unknown): error is NetworkError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string' &&
    ['NETWORK_ERROR', 'API_TIMEOUT', 'API_UNAVAILABLE'].includes((error as { code: string }).code)
  );
}

export function isValidationError(error: unknown): error is ValidationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'VALIDATION_FAILED'
  );
}

export function isComponentError(error: unknown): error is ComponentError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'COMPONENT_CRASHED' &&
    'componentName' in error
  );
}

// Error utility type for functions that may fail
export type Result<T, E = EmailRecipientError> =
  | { success: true; data: T }
  | { success: false; error: E };

// Async result type
export type AsyncResult<T, E = EmailRecipientError> = Promise<Result<T, E>>;
