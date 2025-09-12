/**
 * API Client - Unified API Client Interface for Frontend
 *
 * Provides the core API client interface and base implementation
 * for Draco Sports Manager frontend. Defines transport-agnostic interfaces
 * that can be implemented with different HTTP libraries (fetch, axios, etc.).
 */

// Main API client interface and base implementation
export type { ApiClient, ClientStats } from './ApiClient.js';
export { BaseApiClient } from './BaseApiClient.js';

// Export adapters
export { FetchAdapter, createFetchClient } from './adapters/FetchAdapter.js';

// Export all client-specific types
export * from './types/index.js';

// Export transformers
export * from './transformers/index.js';

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
