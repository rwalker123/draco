/**
 * API Client configuration types
 * 
 * This module defines configuration interfaces for API clients,
 * including authentication, retry policies, and request options.
 */

import type { ApiError, ErrorCode } from '@draco/shared-types';

/**
 * Configuration options for API client instances
 */
export interface ApiClientConfig {
  /** Base URL for all API requests (e.g., 'https://api.example.com') */
  baseURL?: string;
  
  /** Default request timeout in milliseconds */
  timeout?: number;
  
  /** Default number of retry attempts for failed requests */
  retries?: number;
  
  /** Function to provide the current authentication token */
  authTokenProvider?: () => string | null;
  
  /** Global error handler for all requests */
  errorHandler?: (error: ApiError) => void;
  
  /** Default headers to include with all requests */
  defaultHeaders?: Record<string, string>;
  
  /** Whether to validate response data against schemas */
  validateResponses?: boolean;
  
  /** Whether to log requests and responses (for development) */
  enableLogging?: boolean;
  
  /** Custom user agent string */
  userAgent?: string;
  
  /** Whether to follow redirects */
  followRedirects?: boolean;
  
  /** Maximum number of redirects to follow */
  maxRedirects?: number;
  
  /** Whether to include credentials (cookies) with requests */
  includeCredentials?: boolean;
}

/**
 * Request-specific options that can override client defaults
 */
export interface RequestOptions {
  /** Additional headers for this request */
  headers?: Record<string, string>;
  
  /** Timeout for this specific request (overrides client default) */
  timeout?: number;
  
  /** Number of retries for this specific request (overrides client default) */
  retries?: number;
  
  /** Whether to validate the response for this request */
  validateResponse?: boolean;
  
  /** Custom retry policy for this request */
  retryPolicy?: RetryPolicy;
  
  /** Whether to include the authentication token */
  skipAuth?: boolean;
  
  /** Signal for request cancellation */
  signal?: AbortSignal;
  
  /** Whether to cache this request response */
  cache?: boolean;
  
  /** Cache TTL in milliseconds */
  cacheTtl?: number;
  
  /** Custom error handler for this specific request */
  errorHandler?: (error: ApiError) => void;
  
  /** Additional metadata for request tracking */
  metadata?: Record<string, unknown>;
}

/**
 * Retry policy configuration
 */
export interface RetryPolicy {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  
  /** Initial delay between retries in milliseconds */
  initialDelay: number;
  
  /** Maximum delay between retries in milliseconds */
  maxDelay: number;
  
  /** Multiplier for exponential backoff */
  backoffMultiplier: number;
  
  /** Whether to add random jitter to delays */
  jitter: boolean;
  
  /** Error codes that should trigger retries */
  retryableErrorCodes?: ErrorCode[];
  
  /** Custom function to determine if an error is retryable */
  isRetryable?: (error: ApiError) => boolean;
  
  /** Custom function to calculate retry delay */
  calculateDelay?: (attemptNumber: number, error: ApiError) => number;
}

/**
 * File upload options
 */
export interface FileUploadOptions extends RequestOptions {
  /** Maximum file size in bytes */
  maxFileSize?: number;
  
  /** Allowed file types (MIME types) */
  allowedTypes?: string[];
  
  /** Progress callback for upload tracking */
  onProgress?: (progress: UploadProgress) => void;
  
  /** Whether to generate thumbnails for image files */
  generateThumbnails?: boolean;
  
  /** Custom filename to use for the uploaded file */
  filename?: string;
  
  /** Field name for the file in the form data */
  fieldName?: string;
}

/**
 * Upload progress information
 */
export interface UploadProgress {
  /** Number of bytes uploaded */
  loaded: number;
  
  /** Total number of bytes to upload */
  total: number;
  
  /** Progress percentage (0-100) */
  percentage: number;
  
  /** Upload speed in bytes per second */
  speed?: number;
  
  /** Estimated time remaining in milliseconds */
  timeRemaining?: number;
}

/**
 * Request interceptor function type
 */
export type RequestInterceptor = (
  url: string,
  options: RequestOptions
) => Promise<{ url: string; options: RequestOptions }> | { url: string; options: RequestOptions };

/**
 * Response interceptor function type
 */
export type ResponseInterceptor = (
  response: unknown,
  url: string,
  options: RequestOptions
) => Promise<unknown> | unknown;

/**
 * Error interceptor function type
 */
export type ErrorInterceptor = (
  error: ApiError,
  url: string,
  options: RequestOptions
) => Promise<ApiError> | ApiError | never;

/**
 * Interceptor configuration
 */
export interface InterceptorConfig {
  /** Request interceptors (executed before sending request) */
  request?: RequestInterceptor[];
  
  /** Response interceptors (executed after receiving response) */
  response?: ResponseInterceptor[];
  
  /** Error interceptors (executed when an error occurs) */
  error?: ErrorInterceptor[];
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Required<Omit<ApiClientConfig, 'baseURL' | 'authTokenProvider' | 'errorHandler'>> = {
  timeout: 30000, // 30 seconds
  retries: 3,
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  validateResponses: false,
  enableLogging: false,
  userAgent: 'Draco-API-Client/1.0',
  followRedirects: true,
  maxRedirects: 5,
  includeCredentials: false
};

/**
 * Default retry policy
 */
export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  jitter: true
};