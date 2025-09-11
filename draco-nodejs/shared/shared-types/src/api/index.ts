/**
 * API types module exports
 * 
 * This module exports all API-related types used for communication between
 * the frontend and backend components of Draco Sports Manager.
 */

// Response types
export type {
  ApiResponse,
  PaginatedResponse,
  PaginatedApiResponse,
  EmptyResponse,
  FileUploadResponse,
  HealthCheckResponse
} from './responses.js';

// Error types and utilities
export {
  ErrorCategory,
  ErrorCodes,
  StatusCodeToCategory,
  isRetryableError,
  getRetryDelay
} from './errors.js';

export type {
  ErrorCode,
  ApiError,
  ValidationError,
  ValidationApiError
} from './errors.js';