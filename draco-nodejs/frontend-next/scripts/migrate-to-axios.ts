/**
 * Migration Script: Fetch to Axios
 * This script helps identify patterns for converting fetch calls to axios
 *
 * Usage: This is a reference script for manual migration patterns
 */

import axios from 'axios';
import axiosInstance from '../utils/axiosConfig';

// ============================================================================
// MIGRATION PATTERNS REFERENCE
// ============================================================================

/**
 * Pattern 1: Simple GET requests
 *
 * OLD (fetch):
 * const response = await fetch('/api/endpoint');
 * const data = await response.json();
 *
 * NEW (axios):
 * const response = await axiosInstance.get('/endpoint');
 * const data = response.data;
 */

/**
 * Pattern 2: GET with manual auth header
 *
 * OLD (fetch):
 * const response = await fetch('/api/endpoint', {
 *   headers: { Authorization: `Bearer ${token}` }
 * });
 *
 * NEW (axios with interceptor):
 * const response = await axiosInstance.get('/endpoint');
 * // Auth header added automatically by interceptor
 */

/**
 * Pattern 3: POST with JSON body
 *
 * OLD (fetch):
 * const response = await fetch('/api/endpoint', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     Authorization: `Bearer ${token}`
 *   },
 *   body: JSON.stringify(data)
 * });
 *
 * NEW (axios):
 * const response = await axiosInstance.post('/endpoint', data);
 */

/**
 * Pattern 4: Error handling with response.ok check
 *
 * OLD (fetch):
 * if (!response.ok) {
 *   throw new Error(`HTTP ${response.status}`);
 * }
 *
 * NEW (axios):
 * // Axios throws automatically for 4xx/5xx responses
 * // Use try/catch for error handling
 */

/**
 * Pattern 5: Using apiRequest utility
 *
 * OLD (apiRequest):
 * import { apiRequest } from '../utils/apiClient';
 * const result = await apiRequest<T>(url, options);
 * if (result.success) { ... }
 *
 * NEW (axios with IServiceResponse compatibility):
 * import { api } from '../utils/axiosConfig';
 * const result = await api.get<T>(url);
 * if (result.success) { ... }
 */

// ============================================================================
// MIGRATION HELPER FUNCTIONS
// ============================================================================

/**
 * Convert fetch options to axios config
 */
export function convertFetchToAxiosConfig(fetchOptions: RequestInit) {
  const { method = 'GET', headers, body, ...rest } = fetchOptions;

  return {
    method: method.toLowerCase(),
    headers,
    data: body ? JSON.parse(body as string) : undefined,
    ...rest,
  };

  export default migrateToAxios;
}

/**
 * Helper to convert URLs by removing /api prefix
 */
export function convertApiUrl(url: string): string {
  return url.replace(/^\/api/, '');
}

// ============================================================================
// COMMON SERVICE PATTERNS
// ============================================================================

/**
 * Pattern for class-based services (like EmailService)
 * - Keep the class structure
 * - Replace axios calls in methods
 * - Use centralized error handling
 */
export class MigratedServiceExample {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  // NEW: Methods use axiosInstance instead of manual fetch
  async getData(id: string) {
    try {
      const response = await axiosInstance.get(`/data/${id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw error;
    }
  }

  async createData(data: unknown) {
    const response = await axiosInstance.post('/data', data);
    return response.data;
  }
}

/**
 * Pattern for hook-based data fetching
 */
export function useDataFetching(_url: string) {
  // NEW: Use axiosInstance in useEffect
  // React.useEffect(() => {
  //   axiosInstance.get(url)
  //     .then(response => {
  //       // Handle response.data
  //     })
  //     .catch(error => {
  //       // Handle axios error
  //     });
  // }, [url]);
}

const migrateToAxios = {
  convertFetchToAxiosConfig,
  convertApiUrl,
  MigratedServiceExample,
};
