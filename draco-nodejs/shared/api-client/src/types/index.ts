/**
 * API Client types module exports
 * 
 * This module exports all client-specific types used for configuring
 * and working with API clients in Draco Sports Manager.
 */

// Configuration types
export type {
  ApiClientConfig,
  RequestOptions,
  RetryPolicy,
  FileUploadOptions,
  UploadProgress,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  InterceptorConfig
} from './config.js';

export {
  DEFAULT_CONFIG,
  DEFAULT_RETRY_POLICY
} from './config.js';

// Request types
export type {
  HttpMethod,
  RequestData,
  SearchParams,
  RequestHeaders,
  ApiRequest,
  PaginationParams,
  SortParams,
  FilterParams,
  ListQueryParams,
  FileUploadRequest,
  BatchRequest,
  RequestContext,
  PathParams,
  TypedEndpoint,
  UrlBuilder
} from './requests.js';

export {
  ContentType
} from './requests.js';

// Client-specific response types
export type {
  ClientResponse,
  PaginatedClientResponse
} from './responses.js';