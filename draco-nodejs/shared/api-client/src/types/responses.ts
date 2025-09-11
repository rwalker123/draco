/**
 * Client-specific response type definitions for Draco Sports Manager API Client
 * 
 * This module defines the response formats used by the API client to provide
 * a consistent interface to frontend code, including additional error handling
 * information not present in the backend ApiResponse format.
 */

import type { PaginatedResponse } from '@draco/shared-types';

/**
 * Frontend client response format
 * Used by the API client to provide a consistent interface to frontend code
 * Includes additional error handling information not present in backend responses
 * 
 * @template T - The type of the data payload
 */
export interface ClientResponse<T> {
  /** Indicates if the request was successful */
  success: boolean;
  /** The actual data payload when successful (optional for error cases) */
  data?: T;
  /** Human-readable error message when request fails */
  error?: string;
  /** Machine-readable error code for programmatic error handling */
  errorCode?: string;
  /** HTTP status code for the response */
  statusCode?: number;
}

/**
 * Type alias for paginated client responses
 * Combines the standard ClientResponse with pagination metadata
 * 
 * @template T - The type of individual items in the list
 */
export type PaginatedClientResponse<T> = ClientResponse<PaginatedResponse<T>>;