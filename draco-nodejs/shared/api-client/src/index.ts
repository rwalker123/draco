/**
 * @draco/api-client - Unified API Client Interface
 * 
 * This package provides the core API client interface and base implementation
 * for Draco Sports Manager. It defines transport-agnostic interfaces that can
 * be implemented with different HTTP libraries (fetch, axios, etc.).
 * 
 * @packageDocumentation
 */

// Main API client interface
export type { ApiClient, ClientStats } from './ApiClient.js';

// Base implementation class
export { BaseApiClient } from './BaseApiClient.js';

// Export all client-specific types
export * from './types/index.js';

/**
 * Re-export commonly used backend/shared types for convenience
 */
export type {
  // Response types (backend/shared)
  ApiResponse,
  PaginatedResponse,
  EmptyResponse,
  FileUploadResponse,
  
  // Error types
  ApiError,
  ErrorCategory,
  ErrorCode,
  ValidationError
} from '@draco/shared-types';

/**
 * Version information
 */
export const VERSION = '1.0.0';

/**
 * Package metadata
 */
export const PACKAGE_INFO = {
  name: '@draco/api-client',
  version: VERSION,
  description: 'Unified API client interface for Draco Sports Manager'
} as const;