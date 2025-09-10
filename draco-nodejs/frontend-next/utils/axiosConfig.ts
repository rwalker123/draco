/**
 * Centralized Axios Configuration
 * Provides standardized HTTP client with auth handling and error processing
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { IServiceResponse } from '../types/playerClassifieds';
import { parseApiError } from './errorHandling';

// Create the main axios instance
export const axiosInstance: AxiosInstance = axios.create({
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth token management
export const getAuthToken = (): string | null => {
  return typeof window !== 'undefined' ? localStorage.getItem('jwtToken') : null;
};

// Request interceptor - inject auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - handle common errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle auth failures globally
    if (error.response?.status === 401) {
      // Clear invalid token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('jwtToken');
      }

      // Redirect to login if not already there
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Axios wrapper that returns IServiceResponse for backward compatibility
 * Use this when you need the IServiceResponse pattern
 */
export async function axiosRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<IServiceResponse<T>> {
  try {
    let response: AxiosResponse<T>;

    switch (method) {
      case 'GET':
        response = await axiosInstance.get(url, config);
        break;
      case 'POST':
        response = await axiosInstance.post(url, data, config);
        break;
      case 'PUT':
        response = await axiosInstance.put(url, data, config);
        break;
      case 'DELETE':
        response = await axiosInstance.delete(url, config);
        break;
      case 'PATCH':
        response = await axiosInstance.patch(url, data, config);
        break;
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      let errorMessage: string;
      let errorCode: string;

      if (error.response) {
        // Server responded with error status
        try {
          const parsed = parseApiError(error.response.data);
          errorMessage = parsed.message;
          errorCode = error.response.statusText;
        } catch {
          errorMessage = error.response.statusText || `HTTP ${error.response.status}`;
          errorCode = error.response.statusText;
        }

        return {
          success: false,
          error: errorMessage,
          errorCode,
          statusCode: error.response.status,
        };
      } else {
        // Network error or request setup error
        return {
          success: false,
          error: error.message || 'Network error occurred',
          errorCode: 'NETWORK_ERROR',
          statusCode: 0,
        };
      }
    }

    // Non-axios error
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorCode: 'UNKNOWN_ERROR',
      statusCode: 0,
    };
  }
}

/**
 * Convenience methods for common HTTP operations
 */
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    axiosRequest<T>('GET', url, undefined, config),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    axiosRequest<T>('POST', url, data, config),
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    axiosRequest<T>('PUT', url, data, config),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    axiosRequest<T>('DELETE', url, undefined, config),
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    axiosRequest<T>('PATCH', url, data, config),
};

// Export the main instance for direct use (preferred for new code)
export default axiosInstance;
