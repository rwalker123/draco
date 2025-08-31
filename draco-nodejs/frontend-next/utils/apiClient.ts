/**
 * API Client utility for standardized error handling and response processing
 */

import { IServiceResponse } from '../types/playerClassifieds';
import { parseApiError } from './errorHandling';

export interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * Standardized API client that returns IServiceResponse for consistent error handling
 *
 * @param url - The URL to fetch
 * @param options - Fetch options (method, headers, body, etc.)
 * @returns Promise<IServiceResponse<T>> - Standardized response object
 *
 * @example
 * ```typescript
 * const result = await apiRequest<UserData>('/api/users/123', {
 *   method: 'GET',
 *   headers: { Authorization: `Bearer ${token}` }
 * });
 *
 * if (result.success) {
 *   console.log('User data:', result.data);
 * } else {
 *   console.error('Error:', result.error);
 * }
 * ```
 */
export async function apiRequest<T>(
  url: string,
  options: FetchOptions = {},
): Promise<IServiceResponse<T>> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      // Handle non-success HTTP status codes
      let errorMessage: string;
      let errorCode: string;

      try {
        const errorData = await response.json();
        const parsed = parseApiError(errorData);
        errorMessage = parsed.message;
        errorCode = response.statusText;
      } catch {
        // If we can't parse JSON, fall back to status text
        errorMessage = response.statusText || `HTTP ${response.status}`;
        errorCode = response.statusText;
      }

      return {
        success: false,
        error: errorMessage,
        errorCode,
        statusCode: response.status,
      };
    }

    // Handle successful responses
    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    // Handle network errors or other exceptions
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
      errorCode: 'NETWORK_ERROR',
      statusCode: 0,
    };
  }
}

/**
 * API client for requests that don't return data (like DELETE operations)
 *
 * @param url - The URL to fetch
 * @param options - Fetch options (method, headers, body, etc.)
 * @returns Promise<IServiceResponse<void>> - Standardized response object without data
 */
export async function apiRequestVoid(
  url: string,
  options: FetchOptions = {},
): Promise<IServiceResponse<void>> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      // Handle non-success HTTP status codes
      let errorMessage: string;
      let errorCode: string;

      try {
        const errorData = await response.json();
        const parsed = parseApiError(errorData);
        errorMessage = parsed.message;
        errorCode = response.statusText;
      } catch {
        // If we can't parse JSON, fall back to status text
        errorMessage = response.statusText || `HTTP ${response.status}`;
        errorCode = response.statusText;
      }

      return {
        success: false,
        error: errorMessage,
        errorCode,
        statusCode: response.status,
      };
    }

    // Successful request - no data expected
    return {
      success: true,
    };
  } catch (error) {
    // Handle network errors or other exceptions
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
      errorCode: 'NETWORK_ERROR',
      statusCode: 0,
    };
  }
}
