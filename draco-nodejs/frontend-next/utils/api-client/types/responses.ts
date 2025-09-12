/**
 * Client-specific response type definitions for Draco Sports Manager API Client
 *
 * This module re-exports the shared ApiResponse types for use in the API client.
 * The client uses the same response format as the backend for consistency.
 */

import type { PaginatedResponse, ApiResponse } from '@draco/shared-types';

/**
 * Type alias for paginated API responses in the client
 * Combines the standard ApiResponse with pagination metadata
 *
 * @template T - The type of individual items in the list
 */
export type PaginatedApiResponse<T> = ApiResponse<PaginatedResponse<T>>;

// Re-export shared types for convenience
export type { ApiResponse } from '@draco/shared-types';
