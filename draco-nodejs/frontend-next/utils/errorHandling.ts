/**
 * Centralized Error Handling Utilities
 * Provides consistent error handling, logging, and recovery across the application
 */

import {
  EmailRecipientError,
  EmailRecipientErrorCode,
  ErrorSeverity,
  Result,
  AsyncResult,
  isEmailRecipientError,
  isNetworkError,
  isValidationError,
  isComponentError,
} from '../types/errors';

// Configuration for error handling behavior
interface ErrorHandlingConfig {
  enableLogging: boolean;
  enableRetries: boolean;
  maxRetries: number;
  retryDelayMs: number;
  enableUserNotifications: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// Default configuration
const defaultConfig: ErrorHandlingConfig = {
  enableLogging: true,
  enableRetries: true,
  maxRetries: 3,
  retryDelayMs: 1000,
  enableUserNotifications: true,
  logLevel: 'error',
};

let config = { ...defaultConfig };

/**
 * Configure error handling behavior
 */
export function configureErrorHandling(newConfig: Partial<ErrorHandlingConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Creates a standardized EmailRecipientError
 */
export function createEmailRecipientError(
  code: EmailRecipientErrorCode,
  message: string,
  options: {
    userMessage?: string;
    details?: unknown;
    recoverable?: boolean;
    retryable?: boolean;
    context?: EmailRecipientError['context'];
  } = {},
): EmailRecipientError {
  const {
    userMessage = generateUserFriendlyMessage(code, message),
    details,
    recoverable = isRecoverableError(code),
    retryable = isRetryableError(code),
    context,
  } = options;

  return {
    code,
    message,
    userMessage,
    details,
    recoverable,
    retryable,
    context,
    timestamp: new Date(),
    stack: new Error().stack,
  };
}

/**
 * Transforms various error types into standardized EmailRecipientError
 */
export function normalizeError(
  error: unknown,
  context?: EmailRecipientError['context'],
): EmailRecipientError {
  // Already a standardized error
  if (isEmailRecipientError(error)) {
    return { ...error, context: { ...error.context, ...context } };
  }

  // Network errors
  if (isNetworkError(error)) {
    return createEmailRecipientError(error.code as EmailRecipientErrorCode, error.message, {
      context,
      details: { statusCode: error.statusCode, endpoint: error.endpoint },
    });
  }

  // Validation errors
  if (isValidationError(error)) {
    return createEmailRecipientError(EmailRecipientErrorCode.VALIDATION_FAILED, error.message, {
      context,
      details: { field: error.field, value: error.value },
    });
  }

  // Component errors
  if (isComponentError(error)) {
    return createEmailRecipientError(EmailRecipientErrorCode.COMPONENT_CRASHED, error.message, {
      context,
      details: { componentName: error.componentName, props: error.props },
      recoverable: true,
      retryable: false,
    });
  }

  // Standard JavaScript Error
  if (error instanceof Error) {
    // Try to infer error type from message patterns
    const errorCode = inferErrorCodeFromMessage(error.message);
    return createEmailRecipientError(errorCode, error.message, {
      context,
      details: { originalError: error.name, stack: error.stack },
    });
  }

  // Unknown error type
  return createEmailRecipientError(
    EmailRecipientErrorCode.UNKNOWN_ERROR,
    typeof error === 'string' ? error : 'An unknown error occurred',
    { context, details: error },
  );
}

/**
 * Handles API response errors and converts them to standardized format
 */
export function handleApiError(response: Response, responseData?: unknown): EmailRecipientError {
  const statusCode = response.status;
  const endpoint = response.url;

  // Handle specific HTTP status codes
  switch (statusCode) {
    case 401:
      return createEmailRecipientError(
        EmailRecipientErrorCode.AUTHENTICATION_REQUIRED,
        'Authentication required',
        {
          userMessage: 'Please log in again to continue',
          retryable: false,
          details: { statusCode, endpoint },
        },
      );

    case 403:
      return createEmailRecipientError(
        EmailRecipientErrorCode.AUTHORIZATION_DENIED,
        'Access denied',
        {
          userMessage: 'You do not have permission to access this resource',
          retryable: false,
          details: { statusCode, endpoint },
        },
      );

    case 404:
      return createEmailRecipientError(
        EmailRecipientErrorCode.CONTACT_NOT_FOUND,
        'Resource not found',
        {
          userMessage: 'The requested resource could not be found',
          retryable: false,
          details: { statusCode, endpoint },
        },
      );

    case 408:
    case 504:
      return createEmailRecipientError(EmailRecipientErrorCode.API_TIMEOUT, 'Request timeout', {
        userMessage: 'The request took too long to complete. Please try again',
        retryable: true,
        details: { statusCode, endpoint },
      });

    case 429:
      return createEmailRecipientError(EmailRecipientErrorCode.RATE_LIMITED, 'Too many requests', {
        userMessage: 'Too many requests. Please wait a moment and try again',
        retryable: true,
        details: { statusCode, endpoint },
      });

    case 500:
    case 502:
    case 503:
      // Try to extract error message from server response
      let serverMessage = 'Service temporarily unavailable';
      let userMessage = 'The service is temporarily unavailable. Please try again later';

      if (responseData) {
        const parsed = parseApiError(responseData);
        if (parsed.message && parsed.message !== 'An unexpected error occurred') {
          serverMessage = parsed.message;
          userMessage = parsed.message; // Use server message as user message
        }
      }

      return createEmailRecipientError(EmailRecipientErrorCode.SERVICE_UNAVAILABLE, serverMessage, {
        userMessage,
        retryable: true,
        details: { statusCode, endpoint, responseData },
      });

    default:
      // Try to extract error message from response
      let message = `HTTP ${statusCode}: ${response.statusText}`;
      if (responseData && typeof responseData === 'object' && 'message' in responseData) {
        message = (responseData as { message: unknown }).message as string;
      }

      return createEmailRecipientError(EmailRecipientErrorCode.API_UNAVAILABLE, message, {
        userMessage: 'An error occurred while communicating with the server',
        retryable: statusCode >= 500,
        details: { statusCode, endpoint, responseData },
      });
  }
}

/**
 * Logs errors with appropriate level and context
 */
export function logError(error: EmailRecipientError, operation?: string): void {
  if (!config.enableLogging) return;

  const logData = {
    code: error.code,
    message: error.message,
    userMessage: error.userMessage,
    recoverable: error.recoverable,
    retryable: error.retryable,
    context: error.context,
    operation,
    timestamp: error.timestamp,
  };

  const severity = getErrorSeverity(error);

  switch (severity) {
    case ErrorSeverity.CRITICAL:
      console.error('CRITICAL ERROR:', logData, error.details);
      break;
    case ErrorSeverity.HIGH:
      console.error('HIGH SEVERITY ERROR:', logData, error.details);
      break;
    case ErrorSeverity.MEDIUM:
      console.warn('MEDIUM SEVERITY ERROR:', logData, error.details);
      break;
    case ErrorSeverity.LOW:
      if (config.logLevel === 'debug') {
        console.info('LOW SEVERITY ERROR:', logData, error.details);
      }
      break;
  }
}

/**
 * Determines error severity based on error code and context
 */
export function getErrorSeverity(error: EmailRecipientError): ErrorSeverity {
  switch (error.code) {
    case EmailRecipientErrorCode.AUTHENTICATION_REQUIRED:
    case EmailRecipientErrorCode.AUTHENTICATION_EXPIRED:
      return ErrorSeverity.HIGH;

    case EmailRecipientErrorCode.AUTHORIZATION_DENIED:
    case EmailRecipientErrorCode.INSUFFICIENT_PERMISSIONS:
      return ErrorSeverity.MEDIUM;

    case EmailRecipientErrorCode.COMPONENT_CRASHED:
    case EmailRecipientErrorCode.SERVICE_UNAVAILABLE:
      return ErrorSeverity.HIGH;

    case EmailRecipientErrorCode.NETWORK_ERROR:
    case EmailRecipientErrorCode.API_UNAVAILABLE:
      return ErrorSeverity.MEDIUM;

    case EmailRecipientErrorCode.VALIDATION_FAILED:
    case EmailRecipientErrorCode.SEARCH_FAILED:
    case EmailRecipientErrorCode.FILTER_ERROR:
      return ErrorSeverity.LOW;

    case EmailRecipientErrorCode.API_TIMEOUT:
    case EmailRecipientErrorCode.RATE_LIMITED:
      return ErrorSeverity.LOW;

    default:
      return ErrorSeverity.MEDIUM;
  }
}

/**
 * Implements exponential backoff retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
    retryCondition?: (error: EmailRecipientError) => boolean;
  } = {},
): Promise<T> {
  const {
    maxRetries = config.maxRetries,
    initialDelayMs = config.retryDelayMs,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    retryCondition = (error) => error.retryable,
  } = options;

  let lastError: EmailRecipientError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = normalizeError(error);

      // Don't retry if not retryable or max attempts reached
      if (!retryCondition(lastError) || attempt === maxRetries) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelayMs * Math.pow(backoffMultiplier, attempt), maxDelayMs);

      logError(lastError, `Retry attempt ${attempt + 1}/${maxRetries + 1}`);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Wraps async operations to return Result type instead of throwing
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context?: EmailRecipientError['context'],
): AsyncResult<T> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const normalizedError = normalizeError(error, context);
    logError(normalizedError, 'safeAsync operation');
    return { success: false, error: normalizedError };
  }
}

/**
 * Wraps sync operations to return Result type instead of throwing
 */
export function safe<T>(operation: () => T, context?: EmailRecipientError['context']): Result<T> {
  try {
    const data = operation();
    return { success: true, data };
  } catch (error) {
    const normalizedError = normalizeError(error, context);
    logError(normalizedError, 'safe operation');
    return { success: false, error: normalizedError };
  }
}

/**
 * Creates error recovery suggestions for users
 */
export function getRecoveryActions(error: EmailRecipientError): string[] {
  const actions: string[] = [];

  switch (error.code) {
    case EmailRecipientErrorCode.AUTHENTICATION_REQUIRED:
    case EmailRecipientErrorCode.AUTHENTICATION_EXPIRED:
      actions.push('Please log in again');
      break;

    case EmailRecipientErrorCode.NETWORK_ERROR:
    case EmailRecipientErrorCode.API_TIMEOUT:
      actions.push('Check your internet connection');
      actions.push('Try refreshing the page');
      break;

    case EmailRecipientErrorCode.SERVICE_UNAVAILABLE:
      actions.push('Wait a few minutes and try again');
      actions.push('Contact support if the problem persists');
      break;

    case EmailRecipientErrorCode.AUTHORIZATION_DENIED:
      actions.push('Contact your administrator for access');
      break;

    case EmailRecipientErrorCode.VALIDATION_FAILED:
      actions.push('Check your input and try again');
      break;

    case EmailRecipientErrorCode.SEARCH_FAILED:
      actions.push('Try a different search term');
      actions.push('Clear filters and try again');
      break;

    default:
      if (error.retryable) {
        actions.push('Try again');
      }
      actions.push('Refresh the page');
      break;
  }

  return actions;
}

// Helper functions

/**
 * Generates user-friendly error messages
 * Uses server error messages when available, falls back to generic messages for technical errors
 */
function generateUserFriendlyMessage(
  code: EmailRecipientErrorCode,
  technicalMessage: string,
): string {
  // Check if the technical message looks like a server-provided error message
  const isServerErrorMessage = isServerError(technicalMessage);

  // For server error messages, use them directly as they're already user-friendly
  if (isServerErrorMessage) {
    return technicalMessage;
  }

  // For technical errors, use generic user-friendly messages
  const userMessages: Record<EmailRecipientErrorCode, string> = {
    [EmailRecipientErrorCode.NETWORK_ERROR]:
      'Unable to connect to the server. Please check your internet connection.',
    [EmailRecipientErrorCode.API_TIMEOUT]:
      'The request took too long to complete. Please try again.',
    [EmailRecipientErrorCode.API_UNAVAILABLE]:
      'The service is temporarily unavailable. Please try again later.',
    [EmailRecipientErrorCode.RATE_LIMITED]:
      'Too many requests. Please wait a moment before trying again.',
    [EmailRecipientErrorCode.AUTHENTICATION_REQUIRED]: 'Please log in to continue.',
    [EmailRecipientErrorCode.AUTHENTICATION_EXPIRED]:
      'Your session has expired. Please log in again.',
    [EmailRecipientErrorCode.AUTHORIZATION_DENIED]:
      'You do not have permission to access this resource.',
    [EmailRecipientErrorCode.INSUFFICIENT_PERMISSIONS]:
      'You do not have sufficient permissions for this action.',
    [EmailRecipientErrorCode.INVALID_DATA]:
      'The provided data is invalid. Please check your input.',
    [EmailRecipientErrorCode.CONTACT_NOT_FOUND]: 'The requested contact could not be found.',
    [EmailRecipientErrorCode.TEAM_NOT_FOUND]: 'The requested team could not be found.',
    [EmailRecipientErrorCode.SEASON_NOT_FOUND]: 'The requested season could not be found.',
    [EmailRecipientErrorCode.VALIDATION_FAILED]: 'Please check your input and try again.',
    [EmailRecipientErrorCode.SERVICE_UNAVAILABLE]:
      'This service is temporarily unavailable. Please try again later.',
    [EmailRecipientErrorCode.TRANSFORMATION_FAILED]:
      'Unable to process the data. Please try again.',
    [EmailRecipientErrorCode.COMPONENT_CRASHED]:
      'A component has encountered an error. Please refresh the page.',
    [EmailRecipientErrorCode.CACHE_ERROR]:
      'There was an issue with cached data. Please refresh the page.',
    [EmailRecipientErrorCode.SEARCH_FAILED]: 'Unable to complete the search. Please try again.',
    [EmailRecipientErrorCode.FILTER_ERROR]: 'Unable to apply filters. Please try again.',
    [EmailRecipientErrorCode.UNKNOWN_ERROR]:
      'An unexpected error occurred. Please try again or contact support.',
  };

  return userMessages[code] || 'An error occurred. Please try again.';
}

/**
 * Determines if a message appears to be a server-provided error message
 * Server messages are typically user-friendly and don't contain technical details
 */
function isServerError(message: string): boolean {
  // Server error messages are typically:
  // 1. Not empty or just whitespace
  // 2. Don't contain technical error patterns
  // 3. Are reasonably user-friendly (not too technical)

  if (!message || message.trim().length === 0) {
    return false;
  }

  const technicalPatterns = [
    /^Error:/i,
    /^TypeError:/i,
    /^ReferenceError:/i,
    /^SyntaxError:/i,
    /^NetworkError:/i,
    /^FetchError:/i,
    /^AbortError:/i,
    /^TimeoutError:/i,
    /at\s+.*\s+\(.*\)/i, // Stack trace patterns
    /\.js:\d+:\d+/i, // File:line:column patterns
    /node_modules/i,
    /webpack/i,
    /bundle/i,
    /chunk/i,
  ];

  // If it matches technical patterns, it's not a server message
  if (technicalPatterns.some((pattern) => pattern.test(message))) {
    return false;
  }

  // Server messages are typically shorter and more user-friendly
  // They don't contain stack traces or technical details
  const isReasonableLength = message.length <= 200;
  const hasNoStackTrace = !message.includes('at ') && !message.includes('Error:');
  const isUserFriendly = !message.includes('undefined') && !message.includes('null');

  return isReasonableLength && hasNoStackTrace && isUserFriendly;
}

/**
 * Determines if an error is recoverable
 */
function isRecoverableError(code: EmailRecipientErrorCode): boolean {
  const recoverableErrors = [
    EmailRecipientErrorCode.NETWORK_ERROR,
    EmailRecipientErrorCode.API_TIMEOUT,
    EmailRecipientErrorCode.API_UNAVAILABLE,
    EmailRecipientErrorCode.SERVICE_UNAVAILABLE,
    EmailRecipientErrorCode.COMPONENT_CRASHED,
    EmailRecipientErrorCode.CACHE_ERROR,
    EmailRecipientErrorCode.SEARCH_FAILED,
    EmailRecipientErrorCode.FILTER_ERROR,
    EmailRecipientErrorCode.TRANSFORMATION_FAILED,
  ];

  return recoverableErrors.includes(code);
}

/**
 * Determines if an error is retryable
 */
function isRetryableError(code: EmailRecipientErrorCode): boolean {
  const retryableErrors = [
    EmailRecipientErrorCode.NETWORK_ERROR,
    EmailRecipientErrorCode.API_TIMEOUT,
    EmailRecipientErrorCode.API_UNAVAILABLE,
    EmailRecipientErrorCode.SERVICE_UNAVAILABLE,
    EmailRecipientErrorCode.RATE_LIMITED,
    EmailRecipientErrorCode.SEARCH_FAILED,
    EmailRecipientErrorCode.TRANSFORMATION_FAILED,
  ];

  return retryableErrors.includes(code);
}

/**
 * Infers error code from error message patterns
 */
function inferErrorCodeFromMessage(message: string): EmailRecipientErrorCode {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return EmailRecipientErrorCode.NETWORK_ERROR;
  }

  if (lowerMessage.includes('timeout')) {
    return EmailRecipientErrorCode.API_TIMEOUT;
  }

  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('authentication')) {
    return EmailRecipientErrorCode.AUTHENTICATION_REQUIRED;
  }

  if (lowerMessage.includes('forbidden') || lowerMessage.includes('permission')) {
    return EmailRecipientErrorCode.AUTHORIZATION_DENIED;
  }

  if (lowerMessage.includes('not found')) {
    return EmailRecipientErrorCode.CONTACT_NOT_FOUND;
  }

  if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
    return EmailRecipientErrorCode.VALIDATION_FAILED;
  }

  return EmailRecipientErrorCode.UNKNOWN_ERROR;
}

/**
 * Generic API Error Parsing Utilities
 * These utilities eliminate duplicate error parsing code across the frontend
 */

/**
 * Generic interface for API error responses
 */
export interface ApiErrorResponse {
  message?: string;
  error?: string;
  errors?: Record<string, string[]> | string[];
  details?: Array<{
    type?: string;
    value?: unknown;
    msg?: string;
    path?: string;
    location?: string;
  }>;
}

/**
 * Parses API error response data to extract meaningful error information
 */
export function parseApiError(responseData: unknown): {
  message: string;
  validationErrors?: Record<string, string[]>;
  hasValidationErrors: boolean;
} {
  // Handle null/undefined response
  if (!responseData) {
    return {
      message: 'An unexpected error occurred',
      hasValidationErrors: false,
    };
  }

  // Handle string response
  if (typeof responseData === 'string') {
    return {
      message: responseData,
      hasValidationErrors: false,
    };
  }

  // Handle object response
  if (typeof responseData === 'object') {
    const errorData = responseData as ApiErrorResponse;

    // Extract main error message
    let message = errorData.message || errorData.error || 'An unexpected error occurred';

    // Handle validation errors with details array (express-validator format)
    if (errorData.details && Array.isArray(errorData.details)) {
      const fieldErrors = errorData.details
        .filter(
          (detail: { type?: string; msg?: string; path?: string }) =>
            detail.type === 'field' && detail.msg && detail.path,
        )
        .map(
          (detail: { type?: string; msg?: string; path?: string }) =>
            `${detail.path}: ${detail.msg}`,
        )
        .join('; ');

      if (fieldErrors) {
        message = fieldErrors;
      }

      return {
        message,
        hasValidationErrors: true,
      };
    }

    // Handle validation errors (structured format)
    if (
      errorData.errors &&
      typeof errorData.errors === 'object' &&
      !Array.isArray(errorData.errors)
    ) {
      const validationErrors = errorData.errors as Record<string, string[]>;

      // If we have validation errors, create a user-friendly message
      const errorMessages = Object.entries(validationErrors)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join('; ');

      if (errorMessages) {
        message = errorMessages;
      }

      return {
        message,
        validationErrors,
        hasValidationErrors: true,
      };
    }

    // Handle validation errors (array format)
    if (errorData.errors && Array.isArray(errorData.errors)) {
      const errorMessages = errorData.errors.join('; ');
      if (errorMessages) {
        message = errorMessages;
      }

      return {
        message,
        hasValidationErrors: true,
      };
    }

    return {
      message,
      hasValidationErrors: false,
    };
  }

  // Fallback for unknown types
  return {
    message: 'An unexpected error occurred',
    hasValidationErrors: false,
  };
}

/**
 * Handles API error responses by parsing response data and creating appropriate error messages
 * This function eliminates duplicate error handling patterns across service methods
 */
export async function handleApiErrorResponse(
  response: Response,
  fallbackMessage: string = 'Request failed',
): Promise<never> {
  let responseData: unknown;

  try {
    responseData = await response.json();
  } catch {
    // If we can't parse JSON, fall back to status text
    throw new Error(`${fallbackMessage}: ${response.statusText || `HTTP ${response.status}`}`);
  }

  const { message } = parseApiError(responseData);
  throw new Error(`${fallbackMessage}: ${message}`);
}

/**
 * Safe JSON parsing for API responses - returns null if parsing fails
 */
export async function safeParseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Creates a standardized error message for failed API requests
 */
export function createApiErrorMessage(
  operation: string,
  response: Response,
  responseData?: unknown,
): string {
  const { message } = parseApiError(responseData);
  const statusInfo = response.statusText || `HTTP ${response.status}`;

  if (message && message !== 'An unexpected error occurred') {
    return `${operation}: ${message}`;
  }

  return `${operation}: ${statusInfo}`;
}
