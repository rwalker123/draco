/**
 * @draco/shared-types - Shared TypeScript type definitions
 * 
 * This package provides shared type definitions for Draco Sports Manager,
 * including API response formats, error types, and client configuration.
 * 
 * @packageDocumentation
 */

// Re-export all API types
export * from './api/index';

/**
 * Version information for the types package
 */
export const VERSION = '1.0.0';

/**
 * Package metadata
 */
export const PACKAGE_INFO = {
  name: '@draco/shared-types',
  version: VERSION,
  description: 'Shared TypeScript type definitions for Draco Sports Manager API client'
} as const;