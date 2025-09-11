/**
 * Request-related types and utilities
 * 
 * This module defines types for HTTP requests, including method types,
 * request data structures, and parameter handling.
 */

/**
 * HTTP methods supported by the API client
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * Request body data types
 */
export type RequestData = 
  | Record<string, unknown>
  | FormData
  | string
  | Blob
  | ArrayBuffer
  | null
  | undefined;

/**
 * URL search parameters
 */
export type SearchParams = 
  | Record<string, string | number | boolean | null | undefined>
  | URLSearchParams
  | string
  | null
  | undefined;

/**
 * Request headers
 */
export type RequestHeaders = Record<string, string>;

/**
 * Content types for requests
 */
export enum ContentType {
  JSON = 'application/json',
  FORM_DATA = 'multipart/form-data',
  FORM_URLENCODED = 'application/x-www-form-urlencoded',
  TEXT = 'text/plain',
  HTML = 'text/html',
  XML = 'application/xml',
  BINARY = 'application/octet-stream'
}

/**
 * Standard request structure
 */
export interface ApiRequest {
  /** HTTP method */
  method: HttpMethod;
  
  /** Request URL (relative to base URL) */
  url: string;
  
  /** Request headers */
  headers?: RequestHeaders;
  
  /** Request body data */
  data?: RequestData;
  
  /** URL search parameters */
  params?: SearchParams;
  
  /** Request timestamp */
  timestamp: Date;
  
  /** Unique request ID for tracking */
  requestId: string;
}

/**
 * Pagination parameters for list requests
 */
export interface PaginationParams {
  /** Page number (1-based) */
  page?: number;
  
  /** Number of items per page */
  pageSize?: number;
  
  /** Maximum page size allowed */
  maxPageSize?: number;
}

/**
 * Sorting parameters for list requests
 */
export interface SortParams {
  /** Field to sort by */
  sortBy?: string;
  
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  
  /** Multiple sort criteria */
  sorts?: Array<{
    field: string;
    order: 'asc' | 'desc';
  }>;
}

/**
 * Filtering parameters for list requests
 */
export interface FilterParams {
  /** Text search query */
  search?: string;
  
  /** Date range filters */
  dateFrom?: string | Date;
  dateTo?: string | Date;
  
  /** Status filters */
  status?: string | string[];
  
  /** Generic filters */
  filters?: Record<string, unknown>;
}

/**
 * Combined query parameters for list endpoints
 */
export interface ListQueryParams extends PaginationParams, SortParams, FilterParams {
  /** Additional custom parameters */
  [key: string]: unknown;
}

/**
 * File upload request data
 */
export interface FileUploadRequest {
  /** The file to upload */
  file: File | Blob;
  
  /** Field name for the file */
  fieldName?: string;
  
  /** Additional form data */
  data?: Record<string, unknown>;
  
  /** Custom filename */
  filename?: string;
  
  /** Custom content type */
  contentType?: string;
}

/**
 * Batch request for multiple operations
 */
export interface BatchRequest {
  /** Array of individual requests */
  requests: Array<{
    /** Unique identifier for this request in the batch */
    id: string;
    
    /** HTTP method */
    method: HttpMethod;
    
    /** Request URL */
    url: string;
    
    /** Request data */
    data?: RequestData;
    
    /** Request headers */
    headers?: RequestHeaders;
  }>;
  
  /** Whether to stop processing on first error */
  stopOnError?: boolean;
  
  /** Maximum number of concurrent requests */
  maxConcurrency?: number;
}

/**
 * Request context information
 */
export interface RequestContext {
  /** Unique request identifier */
  requestId: string;
  
  /** User identifier (if authenticated) */
  userId?: string;
  
  /** Account identifier */
  accountId?: string;
  
  /** Session identifier */
  sessionId?: string;
  
  /** Request source (web, mobile, api, etc.) */
  source?: string;
  
  /** User agent information */
  userAgent?: string;
  
  /** Client IP address */
  clientIp?: string;
  
  /** Request timestamp */
  timestamp: Date;
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Helper type for extracting path parameters from URL strings
 */
export type PathParams<T extends string> = 
  T extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? { [K in Param]: string } & PathParams<Rest>
    : T extends `${infer _Start}:${infer Param}`
    ? { [K in Param]: string }
    : Record<string, never>;

/**
 * Helper type for type-safe endpoint definitions
 */
export interface TypedEndpoint<TResponse = unknown, TRequest = unknown> {
  /** HTTP method */
  method: HttpMethod;
  
  /** URL path with parameter placeholders */
  path: string;
  
  /** Request data type */
  request?: TRequest;
  
  /** Response data type */
  response: TResponse;
  
  /** Possible error codes for this endpoint */
  errors?: string[];
  
  /** Whether authentication is required */
  requiresAuth?: boolean;
  
  /** Required permissions/roles */
  permissions?: string[];
}

/**
 * Utility type for building URLs with type safety
 */
export type UrlBuilder<T extends string> = (params: PathParams<T>) => string;