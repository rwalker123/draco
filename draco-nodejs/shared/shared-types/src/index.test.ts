/**
 * Basic tests for @draco/shared-types package exports
 */

import { describe, it, expect } from 'vitest';
import { VERSION, PACKAGE_INFO, ErrorCategory, isRetryableError } from './index';

describe('@draco/shared-types', () => {
  it('should export version information', () => {
    expect(VERSION).toBe('1.0.0');
    expect(PACKAGE_INFO).toEqual({
      name: '@draco/shared-types',
      version: '1.0.0',
      description: 'Shared TypeScript type definitions for Draco Sports Manager API client'
    });
  });

  it('should export error utilities', () => {
    expect(ErrorCategory).toBeDefined();
    expect(typeof isRetryableError).toBe('function');
  });

  it('should validate error categorization', () => {
    // Test with a network error (should be retryable)
    const networkError = {
      success: false as const,
      errorCode: 'NETWORK_ERROR' as const,
      errorMessage: 'Network connection failed',
      statusCode: 503,
      category: ErrorCategory.NETWORK,
      retryable: true
    };
    expect(isRetryableError(networkError)).toBe(true);
    
    // Test with a validation error (should not be retryable)
    const validationError = {
      success: false as const,
      errorCode: 'VALIDATION_FAILED' as const,
      errorMessage: 'Validation failed',
      statusCode: 400,
      category: ErrorCategory.VALIDATION,
      retryable: false
    };
    expect(isRetryableError(validationError)).toBe(false);
  });
});