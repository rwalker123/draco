/**
 * Centralized Axios Configuration
 * Provides standardized HTTP client with auth handling and error processing
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
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

// Response interceptor - standardize all responses to { success: boolean, data: T | string }
axiosInstance.interceptors.response.use(
  (response) => {
    // Success responses pass through unchanged - backend already returns { success: true, data: ... }
    return response;
  },
  (error: AxiosError) => {
    // Handle auth failures - clean up invalid tokens but let components handle navigation
    if (error.response?.status === 401) {
      // Clear invalid token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('jwtToken');
      }
    }

    // Convert error to standard format and return resolved promise (not rejected)
    const { message } = parseApiError(error.response?.data);

    // Return a resolved promise with standardized error format
    return Promise.resolve({
      ...error.response,
      data: { success: false, data: message },
    });
  },
);

// Export the main instance for direct use (preferred for new code)
export default axiosInstance;
