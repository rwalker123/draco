/**
 * Fetch API Client Adapter
 *
 * Concrete implementation of the API client using the browser's native fetch() API.
 * Provides a secure-by-default approach to HTTP requests.
 */

import type { ApiResponse, ApiError } from '@draco/shared-types';
import { ErrorCategory, ErrorCodes } from '@draco/shared-types';
import { BaseApiClient } from '../BaseApiClient.js';
import type { HttpMethod, RequestData, RequestOptions, ApiClientConfig } from '../types/index.js';

/**
 * FetchAdapter class that implements the ApiClient interface using fetch()
 */
export class FetchAdapter extends BaseApiClient {
  constructor(config: Partial<ApiClientConfig> = {}) {
    super(config);
  }

  /**
   * Execute HTTP request using fetch()
   */
  protected async executeRequest<TResponse>(
    method: HttpMethod,
    url: string,
    data?: RequestData,
    options?: RequestOptions,
  ): Promise<ApiResponse<TResponse>> {
    const requestOptions = this.prepareRequestOptions(options);

    // Prepare request body
    let body: string | FormData | null = null;
    if (data) {
      if (data instanceof FormData) {
        body = data;
        // Remove Content-Type for FormData to let browser set boundary
        const headers = { ...requestOptions.headers };
        delete headers['Content-Type'];
        requestOptions.headers = headers;
      } else if (typeof data === 'string') {
        body = data;
      } else {
        body = JSON.stringify(data);
      }
    }

    const fetchOptions: RequestInit = {
      method,
      headers: requestOptions.headers,
      body,
    };

    // Add timeout support
    if (requestOptions.timeout) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), requestOptions.timeout);
      fetchOptions.signal = controller.signal;

      try {
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        // Extract backend ApiResponse<TResponse> from fetch Response
        return await this.extractApiResponse<TResponse>(response);
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    }

    const response = await fetch(url, fetchOptions);
    // Extract backend ApiResponse<TResponse> from fetch Response
    return await this.extractApiResponse<TResponse>(response);
  }

  /**
   * Extract and transform backend ApiResponse from fetch Response
   */
  protected async extractApiResponse<TResponse>(
    response: Response,
  ): Promise<ApiResponse<TResponse>> {
    if (!response.ok) {
      // HTTP error response - create ApiError
      let errorMessage = response.statusText || `HTTP ${response.status}`;

      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Ignore JSON parsing errors for error responses
      }

      const apiError: ApiError = {
        success: false,
        errorCode: this.getSemanticErrorCode(response.status),
        errorMessage,
        statusCode: response.status,
        category: this.getErrorCategory(response.status),
        retryable: this.isRetryableStatus(response.status),
      };

      // Return ApiResponse<TResponse> with error in data field
      return {
        success: false,
        data: apiError,
      };
    }

    // Success response
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      try {
        const data = await response.json();

        // Check if backend returned ApiResponse format
        if (typeof data === 'object' && data !== null && 'success' in data) {
          // Backend sent ApiResponse<TResponse> - return as-is
          return data;
        }

        // Direct JSON data - wrap in ApiResponse format
        return {
          success: true,
          data: data,
        };
      } catch (jsonError) {
        // JSON parsing failed
        const apiError: ApiError = {
          success: false,
          errorCode: ErrorCodes.RESPONSE_PROCESSING_ERROR,
          errorMessage:
            jsonError instanceof Error ? jsonError.message : 'Failed to parse JSON response',
          statusCode: response.status,
          category: ErrorCategory.UNKNOWN,
          retryable: false,
        };

        return {
          success: false,
          data: apiError,
        };
      }
    }

    // Non-JSON response (like file download)
    const data = await response.blob();
    return {
      success: true,
      data: data as TResponse,
    };
  }

  /**
   * Handle transport-specific errors and convert to ApiError
   */
  protected handleTransportError(
    error: unknown,
    _url: string,
    _options?: RequestOptions,
  ): ApiError {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      // Network error
      return {
        success: false,
        errorCode: ErrorCodes.NETWORK_ERROR,
        errorMessage: 'Network request failed',
        statusCode: 0,
        category: this.getErrorCategory(0),
        retryable: this.isRetryableStatus(0),
      };
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      // Timeout error
      return {
        success: false,
        errorCode: ErrorCodes.NETWORK_TIMEOUT,
        errorMessage: 'Request timed out',
        statusCode: 0,
        category: ErrorCategory.TIMEOUT,
        retryable: this.isRetryableStatus(0),
      };
    }

    // Generic error
    return {
      success: false,
      errorCode: ErrorCodes.UNKNOWN_ERROR,
      errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
      statusCode: 0,
      category: ErrorCategory.UNKNOWN,
      retryable: false,
    };
  }
}

/**
 * Factory function to create a FetchAdapter instance
 */
export function createFetchClient(config: Partial<ApiClientConfig> = {}): FetchAdapter {
  return new FetchAdapter(config);
}
