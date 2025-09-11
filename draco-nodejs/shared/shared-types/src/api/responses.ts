/**
 * Core API response type definitions for Draco Sports Manager
 * 
 * This module defines the standard response formats used by the backend API.
 * Client-specific response formats are defined in the @draco/api-client package.
 */

/**
 * Standard backend API response format
 * Used by all backend endpoints to maintain consistent response structure
 * 
 * @template T - The type of the data payload
 */
export interface ApiResponse<T> {
  /** Indicates if the request was successful */
  success: boolean;
  /** The actual data payload when successful */
  data: T;
  /** Optional message providing additional context */
  message?: string;
}

/**
 * Paginated response wrapper for list endpoints
 * Provides pagination metadata along with the data
 * 
 * @template T - The type of individual items in the list
 */
export interface PaginatedResponse<T> {
  /** Array of items for the current page */
  items: T[];
  /** Total number of items across all pages */
  totalCount: number;
  /** Current page number (1-based) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Number of items per page */
  pageSize: number;
  /** Whether there are more pages available */
  hasNextPage: boolean;
  /** Whether there are previous pages available */
  hasPreviousPage: boolean;
}

/**
 * Type alias for paginated API responses
 * Combines the standard ApiResponse with pagination metadata
 * 
 * @template T - The type of individual items in the list
 */
export type PaginatedApiResponse<T> = ApiResponse<PaginatedResponse<T>>;


/**
 * Empty response type for endpoints that don't return data
 * Used for DELETE operations and other void endpoints
 */
export interface EmptyResponse {
  /** Always empty for void responses */
  readonly _void: true;
}

/**
 * File upload response
 * Returned by file upload endpoints
 */
export interface FileUploadResponse {
  /** Unique identifier for the uploaded file */
  fileId: string;
  /** Original filename as provided by the client */
  originalName: string;
  /** File size in bytes */
  size: number;
  /** MIME type of the uploaded file */
  mimeType: string;
  /** URL to access the uploaded file (if applicable) */
  url?: string;
  /** Timestamp when the file was uploaded */
  uploadedAt: Date;
}

/**
 * Health check response format
 * Used by health check endpoints to report system status
 */
export interface HealthCheckResponse {
  /** Overall system status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Timestamp of the health check */
  timestamp: Date;
  /** Version information */
  version: string;
  /** Individual service statuses */
  services: Record<string, {
    status: 'healthy' | 'degraded' | 'unhealthy';
    message?: string;
    responseTime?: number;
  }>;
}