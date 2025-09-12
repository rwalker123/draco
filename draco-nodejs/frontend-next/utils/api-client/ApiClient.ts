/**
 * API Client Interface
 *
 * This module defines the main ApiClient interface that provides a transport-agnostic
 * API for making HTTP requests with standardized error handling, authentication,
 * and response transformation.
 */

import type {
  ApiClientConfig,
  RequestOptions,
  FileUploadOptions,
  BatchRequest,
  HttpMethod,
  RequestData,
  SearchParams,
} from './types/index.js';

import type { ApiResponse } from '@draco/shared-types';

/**
 * Main API client interface
 *
 * Provides a transport-agnostic interface for making HTTP requests with
 * standardized error handling, authentication, and response transformation.
 *
 * @example
 * ```typescript
 * const client = new SomeApiClient();
 *
 * // Simple GET request
 * const users = await client.get<User[]>('/api/users');
 *
 * // POST with data
 * const newUser = await client.post<User>('/api/users', {
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * });
 *
 * // File upload
 * const upload = await client.uploadFile<FileUploadResponse>(
 *   '/api/files',
 *   file,
 *   { category: 'profile' }
 * );
 * ```
 */
export interface ApiClient {
  // ============================================================================
  // HTTP METHODS
  // ============================================================================

  /**
   * Perform a GET request
   * Do not use unknown for the response type, as GET responses are usually well-defined.
   *
   * @param endpoint - The API endpoint (relative to base URL)
   * @param options - Request options
   * @returns Promise that resolves to the response data
   */
  get<TResponse>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<TResponse>>;

  /**
   * Perform a POST request
   * Do not use unknown for the response type, as POST responses are usually well-defined.
   *
   * @param endpoint - The API endpoint (relative to base URL)
   * @param data - Request body data
   * @param options - Request options
   * @returns Promise that resolves to the response data
   */
  post<TResponse>(
    endpoint: string,
    data?: RequestData,
    options?: RequestOptions,
  ): Promise<ApiResponse<TResponse>>;

  /**
   * Perform a PUT request
   * Do not use unknown for the response type, as PUT responses are usually well-defined.
   *
   * @param endpoint - The API endpoint (relative to base URL)
   * @param data - Request body data
   * @param options - Request options
   * @returns Promise that resolves to the response data
   */
  put<TResponse>(
    endpoint: string,
    data?: RequestData,
    options?: RequestOptions,
  ): Promise<ApiResponse<TResponse>>;

  /**
   * Perform a DELETE request
   * Do not use unknown for the response type, as DELETE responses are usually well-defined.
   *
   * @param endpoint - The API endpoint (relative to base URL)
   * @param options - Request options
   * @returns Promise that resolves to the response data
   */
  delete<TResponse>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<TResponse>>;

  /**
   * Perform a PATCH request.
   * Do not use unknown for the response type, as PATCH responses are usually well-defined.
   *
   * @param endpoint - The API endpoint (relative to base URL)
   * @param data - Request body data
   * @param options - Request options
   * @returns Promise that resolves to the response data
   */
  patch<TResponse>(
    endpoint: string,
    data?: RequestData,
    options?: RequestOptions,
  ): Promise<ApiResponse<TResponse>>;

  /**
   * Perform a HEAD request
   *
   * @param endpoint - The API endpoint (relative to base URL)
   * @param options - Request options
   * @returns Promise that resolves to the response headers
   */
  head(endpoint: string, options?: RequestOptions): Promise<ApiResponse<Record<string, string>>>;

  /**
   * Generic request method for any HTTP method
   * Do not use unknown for the response type, as responses are usually well-defined.
   *
   * @param method - HTTP method
   * @param endpoint - The API endpoint (relative to base URL)
   * @param data - Request body data
   * @param options - Request options
   * @returns Promise that resolves to the response data
   */
  request<TResponse>(
    method: HttpMethod,
    endpoint: string,
    data?: RequestData,
    options?: RequestOptions,
  ): Promise<ApiResponse<TResponse>>;

  // ============================================================================
  // SPECIALIZED METHODS
  // ============================================================================

  /**
   * Upload a file with optional additional data
   * do not use unknown for the response type, as upload responses are usually well-defined.
   *
   * @param endpoint - The API endpoint for file upload
   * @param file - The file to upload
   * @param data - Additional form data
   * @param options - Upload options
   * @returns Promise that resolves to the upload response
   */
  uploadFile<TResponse>(
    endpoint: string,
    file: File | Blob,
    data?: Record<string, unknown>,
    options?: FileUploadOptions,
  ): Promise<ApiResponse<TResponse>>;

  /**
   * Download a file as a blob
   *
   * @param endpoint - The API endpoint for file download
   * @param options - Request options
   * @returns Promise that resolves to the file blob response
   */
  downloadFile(endpoint: string, options?: RequestOptions): Promise<ApiResponse<Blob>>;

  /**
   * Execute multiple requests in a batch
   * Do not use unknown for the response type, as batch responses are usually well-defined.
   *
   * @param batchRequest - Batch request configuration
   * @param options - Request options applied to all requests
   * @returns Promise that resolves to array of responses
   */
  batch<TResponse>(
    batchRequest: BatchRequest,
    options?: RequestOptions,
  ): Promise<ApiResponse<TResponse>[]>;

  // ============================================================================
  // CONFIGURATION METHODS
  // ============================================================================

  /**
   * Configure the API client with new settings
   * Configuration is merged with existing settings
   *
   * @param config - Partial configuration to apply
   */
  configure(config: Partial<ApiClientConfig>): void;

  /**
   * Get the current configuration
   *
   * @returns Current API client configuration
   */
  getConfig(): Readonly<ApiClientConfig>;

  /**
   * Set or update the authentication token
   *
   * @param token - JWT token or null to clear
   */
  setAuthToken(token: string | null): void;

  /**
   * Get the current authentication token
   *
   * @returns Current token or null if not set
   */
  getAuthToken(): string | null;

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Build a complete URL from endpoint and parameters
   *
   * @param endpoint - The API endpoint
   * @param params - URL search parameters
   * @returns Complete URL string
   */
  buildUrl(endpoint: string, params?: SearchParams): string;

  /**
   * Check if the client is properly configured and ready to use
   *
   * @returns True if the client is ready
   */
  isReady(): boolean;

  /**
   * Clear any cached data or reset client state
   */
  reset(): void;

  /**
   * Get client statistics and metrics
   *
   * @returns Client usage statistics
   */
  getStats(): ClientStats;
}

/**
 * Client usage statistics
 */
export interface ClientStats {
  /** Total number of requests made */
  totalRequests: number;

  /** Number of successful requests */
  successfulRequests: number;

  /** Number of failed requests */
  failedRequests: number;

  /** Number of retried requests */
  retriedRequests: number;

  /** Average response time in milliseconds */
  averageResponseTime: number;

  /** Client creation timestamp */
  createdAt: Date;

  /** Last request timestamp */
  lastRequestAt?: Date;
}
