/**
 * API Client - Unified API Client Interface for Frontend
 *
 * Provides the core API client interface and base implementation
 * for Draco Sports Manager frontend. Defines transport-agnostic interfaces
 * that can be implemented with different HTTP libraries (fetch, axios, etc.).
 */

// Main API client interface and base implementation
export type { ApiClient, ClientStats } from './ApiClient';
export { BaseApiClient } from './BaseApiClient';

// Export adapters
export { FetchAdapter, createFetchClient } from './adapters/FetchAdapter';

// Export all client-specific types
export * from './types/index';

// Export transformers
export * from './transformers/index';

// Re-export commonly used backend/shared types for convenience
export type {
  ApiResponse,
  PaginatedResponse,
  EmptyResponse,
  FileUploadResponse,
  ApiError,
  ErrorCategory,
  ErrorCode,
  ValidationError,
} from '@draco/shared-types';
