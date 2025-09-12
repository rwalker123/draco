/**
 * Base API Client Implementation
 *
 * This module provides an abstract base class that implements common functionality
 * for API clients, including configuration management, error handling, authentication,
 * and request/response transformation.
 */

import type { ApiResponse, ApiError, ErrorCode } from '@draco/shared-types';

import { ErrorCategory, ErrorCodes } from '@draco/shared-types';

import type {
  ApiClientConfig,
  RequestOptions,
  FileUploadOptions,
  BatchRequest,
  HttpMethod,
  RequestData,
  SearchParams,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
} from './types/index.js';

import type { ApiClient, ClientStats } from './ApiClient.js';

import { sanitizeFormData } from '../sanitization.js';

/**
 * Abstract base class for API client implementations
 *
 * Provides common functionality that can be shared across different
 * transport implementations (fetch, axios, etc.)
 */
export abstract class BaseApiClient implements ApiClient {
  protected config: ApiClientConfig;
  protected stats: ClientStats;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = this.mergeConfig(config);
    this.stats = this.initializeStats();
  }

  // ============================================================================
  // ABSTRACT METHODS (must be implemented by concrete classes)
  // ============================================================================

  /**
   * Execute the actual HTTP request
   * This method must be implemented by concrete transport adapters
   *
   * @param method - HTTP method
   * @param url - Complete URL
   * @param data - Request body data
   * @param options - Request options
   * @returns Promise resolving to ApiResponse<TResponse>
   */
  protected abstract executeRequest<TResponse>(
    method: HttpMethod,
    url: string,
    data?: RequestData,
    options?: RequestOptions,
  ): Promise<ApiResponse<TResponse>>;

  /**
   * Handle transport-specific errors and convert to ApiError
   *
   * @param error - Raw transport error
   * @param url - Request URL
   * @param options - Request options
   * @returns Structured API error
   */
  protected abstract handleTransportError(
    error: unknown,
    url: string,
    options?: RequestOptions,
  ): ApiError;

  // ============================================================================
  // HTTP METHODS
  // ============================================================================

  async get<TResponse>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>('GET', endpoint, undefined, options);
  }

  async post<TResponse>(
    endpoint: string,
    data?: RequestData,
    options?: RequestOptions,
  ): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>('POST', endpoint, data, options);
  }

  async put<TResponse>(
    endpoint: string,
    data?: RequestData,
    options?: RequestOptions,
  ): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>('PUT', endpoint, data, options);
  }

  async delete<TResponse>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>('DELETE', endpoint, undefined, options);
  }

  async patch<TResponse>(
    endpoint: string,
    data?: RequestData,
    options?: RequestOptions,
  ): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>('PATCH', endpoint, data, options);
  }

  async head(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<Record<string, string>>> {
    return this.request<Record<string, string>>('HEAD', endpoint, undefined, options);
  }

  async request<TResponse>(
    method: HttpMethod,
    endpoint: string,
    data?: RequestData,
    options?: RequestOptions,
  ): Promise<ApiResponse<TResponse>> {
    const startTime = Date.now();
    const requestOptions = this.prepareRequestOptions(options);
    const url = this.buildUrl(endpoint, requestOptions.params);

    try {
      // Update stats
      this.stats.totalRequests++;
      this.stats.lastRequestAt = new Date();

      // Apply request interceptors
      const interceptedRequest = await this.applyRequestInterceptors(url, requestOptions);

      // Execute the request with retry logic
      const response = await this.executeWithRetry<TResponse>(
        method,
        interceptedRequest.url,
        data,
        interceptedRequest.options,
      );

      // Apply response interceptors
      const interceptedResponse = await this.applyResponseInterceptors(
        response,
        interceptedRequest.url,
        interceptedRequest.options,
      );

      // Update stats
      this.stats.successfulRequests++;
      this.updateAverageResponseTime(Date.now() - startTime);

      return interceptedResponse;
    } catch (error) {
      // Update stats
      this.stats.failedRequests++;
      this.updateAverageResponseTime(Date.now() - startTime);

      // Apply error interceptors
      const apiError = this.handleTransportError(error, url, requestOptions);
      const processedError = await this.applyErrorInterceptors(apiError, url, requestOptions);

      // Transform error to ApiResponse format
      return this.errorToApiResponse<TResponse>(processedError);
    }
  }

  // ============================================================================
  // SPECIALIZED METHODS
  // ============================================================================

  async uploadFile<TResponse>(
    endpoint: string,
    file: File | Blob,
    data?: Record<string, unknown>,
    options?: FileUploadOptions,
  ): Promise<ApiResponse<TResponse>> {
    const formData = new FormData();
    const fieldName = options?.fieldName || 'file';
    const filename = options?.filename || (file instanceof File ? file.name : 'blob');

    formData.append(fieldName, file, filename);

    // Append additional data to form with XSS protection
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          // Sanitize string values to prevent XSS attacks
          const sanitizedValue =
            typeof value === 'string' ? sanitizeFormData(value) : String(value);
          formData.append(key, sanitizedValue);
        }
      });
    }

    // Remove Content-Type header to let browser set it with boundary
    const uploadOptions: RequestOptions = {
      ...options,
      headers: {
        ...options?.headers,
      },
    };
    delete uploadOptions.headers?.['Content-Type'];

    return this.post<TResponse>(endpoint, formData, uploadOptions);
  }

  async downloadFile(endpoint: string, options?: RequestOptions): Promise<ApiResponse<Blob>> {
    // This is a simplified implementation - concrete classes may override
    return this.request<Blob>('GET', endpoint, undefined, {
      ...options,
      headers: {
        ...options?.headers,
        Accept: 'application/octet-stream',
      },
    });
  }

  async batch<TResponse>(
    batchRequest: BatchRequest,
    options?: RequestOptions,
  ): Promise<ApiResponse<TResponse>[]> {
    const { requests, stopOnError = false, maxConcurrency = 5 } = batchRequest;
    const results: ApiResponse<TResponse>[] = [];

    // Execute requests in batches to respect concurrency limit
    for (let i = 0; i < requests.length; i += maxConcurrency) {
      const batch = requests.slice(i, i + maxConcurrency);
      const batchPromises = batch.map(async (req) => {
        try {
          return await this.request<TResponse>(req.method, req.url, req.data, {
            ...options,
            ...req,
          });
        } catch (error) {
          const apiError = this.handleTransportError(error, req.url, options);
          return this.errorToApiResponse<TResponse>(apiError);
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Check for errors if stopOnError is enabled
      if (stopOnError && batchResults.some((result) => !result.success)) {
        break;
      }
    }

    return results;
  }

  // ============================================================================
  // CONFIGURATION METHODS
  // ============================================================================

  configure(config: Partial<ApiClientConfig>): void {
    this.config = this.mergeConfig(config);
  }

  getConfig(): Readonly<ApiClientConfig> {
    return Object.freeze({ ...this.config });
  }

  setAuthToken(token: string | null): void {
    if (token) {
      this.config.defaultHeaders = {
        ...this.config.defaultHeaders,
        Authorization: `Bearer ${token}`,
      };
    } else {
      const headers = { ...this.config.defaultHeaders };
      delete headers['Authorization'];
      this.config.defaultHeaders = headers;
    }
  }

  getAuthToken(): string | null {
    const authHeader = this.config.defaultHeaders?.['Authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return this.config.authTokenProvider?.() || null;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  buildUrl(endpoint: string, params?: SearchParams): string {
    const baseURL = this.config.baseURL || '';
    let url = endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint}`;

    if (params) {
      const searchParams = new URLSearchParams();

      if (typeof params === 'string') {
        return `${url}?${params}`;
      }

      if (params instanceof URLSearchParams) {
        return `${url}?${params.toString()}`;
      }

      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          searchParams.append(key, String(value));
        }
      });

      const paramString = searchParams.toString();
      if (paramString) {
        url += `?${paramString}`;
      }
    }

    return url;
  }

  isReady(): boolean {
    return Boolean(this.config.baseURL);
  }

  reset(): void {
    this.stats = this.initializeStats();
  }

  getStats(): ClientStats {
    return { ...this.stats };
  }

  // ============================================================================
  // INTERCEPTOR METHODS
  // ============================================================================

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  // ============================================================================
  // PROTECTED HELPER METHODS
  // ============================================================================

  protected mergeConfig(config: Partial<ApiClientConfig>): ApiClientConfig {
    const defaultConfig = {
      timeout: 30000,
      retries: 3,
      defaultHeaders: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      validateResponses: false,
      enableLogging: false,
      userAgent: 'Draco-API-Client/1.0',
      followRedirects: true,
      maxRedirects: 5,
      includeCredentials: false,
    };

    return {
      ...defaultConfig,
      ...config,
      defaultHeaders: {
        ...defaultConfig.defaultHeaders,
        ...config.defaultHeaders,
      },
    };
  }

  protected prepareRequestOptions(
    options?: RequestOptions,
  ): RequestOptions & { params?: SearchParams } {
    const headers: Record<string, string> = {
      ...this.config.defaultHeaders,
      ...options?.headers,
    };

    // Security-first approach: Only add auth token when explicitly requested
    if (options?.auth === true) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const result: RequestOptions & { params?: SearchParams } = {
      ...options,
      headers,
    };

    if (this.config.timeout !== undefined) {
      result.timeout = this.config.timeout;
    }

    if (this.config.retries !== undefined) {
      result.retries = this.config.retries;
    }

    return result;
  }

  protected async executeWithRetry<TResponse>(
    method: HttpMethod,
    url: string,
    data?: RequestData,
    options?: RequestOptions,
  ): Promise<ApiResponse<TResponse>> {
    const maxRetries = options?.retries ?? this.config.retries ?? 3;
    let lastError: ApiError | null = null;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        // executeRequest now returns ApiResponse<TResponse> directly
        return await this.executeRequest<TResponse>(method, url, data, options);
      } catch (error) {
        lastError = this.handleTransportError(error, url, options);

        // Don't retry on the last attempt or if error is not retryable
        if (attempt === maxRetries + 1 || !this.isRetryableError(lastError)) {
          break;
        }

        // Update retry stats
        this.stats.retriedRequests++;

        // Wait before retrying
        await this.sleep(this.calculateRetryDelay(attempt, lastError));
      }
    }

    throw lastError;
  }

  protected isRetryableError(error: ApiError): boolean {
    return error.retryable;
  }

  protected calculateRetryDelay(attemptNumber: number, error: ApiError): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds

    let delay = Math.min(baseDelay * Math.pow(2, attemptNumber - 1), maxDelay);

    // Add jitter
    delay += Math.random() * 1000;

    if (error.category === ErrorCategory.RATE_LIMIT) {
      delay *= 2;
    }

    return Math.floor(delay);
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get error category based on HTTP status code
   */
  protected getErrorCategory(statusCode: number): ErrorCategory {
    if (statusCode >= 500) {
      return ErrorCategory.SERVER_ERROR;
    }
    if (statusCode === 401) {
      return ErrorCategory.AUTHENTICATION;
    }
    if (statusCode === 403) {
      return ErrorCategory.AUTHORIZATION;
    }
    if (statusCode === 429) {
      return ErrorCategory.RATE_LIMIT;
    }
    if (statusCode >= 400) {
      return ErrorCategory.CLIENT_ERROR;
    }
    if (statusCode === 0) {
      return ErrorCategory.NETWORK;
    }
    return ErrorCategory.UNKNOWN;
  }

  /**
   * Map HTTP status code to semantic error code
   */
  protected getSemanticErrorCode(statusCode: number): ErrorCode {
    if (statusCode === 404) {
      return ErrorCodes.RESOURCE_NOT_FOUND;
    }
    if (statusCode === 401) {
      return ErrorCodes.AUTH_TOKEN_INVALID;
    }
    if (statusCode === 403) {
      return ErrorCodes.PERMISSION_DENIED;
    }
    if (statusCode === 429) {
      return ErrorCodes.RATE_LIMIT_EXCEEDED;
    }
    if (statusCode >= 500) {
      return ErrorCodes.SERVER_ERROR;
    }
    if (statusCode >= 400) {
      return ErrorCodes.VALIDATION_FAILED;
    }
    return ErrorCodes.UNKNOWN_ERROR;
  }

  /**
   * Check if HTTP status code indicates a retryable error
   */
  protected isRetryableStatus(statusCode: number): boolean {
    // Retry on network errors (0), server errors (5xx), and rate limiting (429)
    return statusCode === 0 || statusCode >= 500 || statusCode === 429;
  }

  protected errorToApiResponse<T>(error: ApiError): ApiResponse<T> {
    return {
      success: false,
      data: error,
    };
  }

  private initializeStats(): ClientStats {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retriedRequests: 0,
      averageResponseTime: 0,
      createdAt: new Date(),
    };
  }

  private updateAverageResponseTime(responseTime: number): void {
    const totalRequests = this.stats.totalRequests;
    const currentAverage = this.stats.averageResponseTime;
    this.stats.averageResponseTime =
      (currentAverage * (totalRequests - 1) + responseTime) / totalRequests;
  }

  private async applyRequestInterceptors(
    url: string,
    options: RequestOptions,
  ): Promise<{ url: string; options: RequestOptions }> {
    let result = { url, options };

    for (const interceptor of this.requestInterceptors) {
      result = await interceptor(result.url, result.options);
    }

    return result;
  }

  private async applyResponseInterceptors<T>(
    response: ApiResponse<T>,
    url: string,
    options: RequestOptions,
  ): Promise<ApiResponse<T>> {
    let result: ApiResponse<T> = response;

    for (const interceptor of this.responseInterceptors) {
      result = (await interceptor(result, url, options)) as ApiResponse<T>;
    }

    return result as ApiResponse<T>;
  }

  private async applyErrorInterceptors(
    error: ApiError,
    url: string,
    options: RequestOptions,
  ): Promise<ApiError> {
    let result = error;

    for (const interceptor of this.errorInterceptors) {
      try {
        result = await interceptor(result, url, options);
      } catch (interceptorError) {
        // If interceptor throws, use the error from interceptor
        if (interceptorError instanceof Error) {
          // Keep the original error structure but update message
          result = {
            ...result,
            errorMessage: interceptorError.message,
          };
        }
      }
    }

    return result;
  }
}
