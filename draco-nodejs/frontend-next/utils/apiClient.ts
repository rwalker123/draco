/**
 * API Client utility - MIGRATED TO AXIOS
 *
 * This file now serves as a simple re-export of axios utilities.
 * All fetch-based utilities have been removed after successful migration.
 *
 * For new code, import directly from './axiosConfig':
 * - import { axiosInstance } from './axiosConfig' for direct axios usage
 * - import { api } from './axiosConfig' for IServiceResponse compatibility
 */

// Re-export axios utilities from the centralized config
export { axiosInstance as default, api, axiosRequest } from './axiosConfig';
