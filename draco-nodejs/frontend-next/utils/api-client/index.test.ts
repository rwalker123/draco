import { describe, it, expect } from 'vitest';
import { BaseApiClient } from './index';
import type { ApiResponse, ApiError } from '@draco/shared-types';
import { ErrorCategory } from '@draco/shared-types';

describe('Api Client Module', () => {
  it('should export BaseApiClient class', () => {
    expect(BaseApiClient).toBeDefined();
    expect(typeof BaseApiClient).toBe('function');
  });

  it('should allow BaseApiClient instantiation', () => {
    // BaseApiClient is abstract, so we create a minimal concrete implementation
    class TestApiClient extends BaseApiClient {
      protected async executeRequest<TResponse>(): Promise<ApiResponse<TResponse>> {
        return {
          success: true,
          data: {} as TResponse,
        };
      }

      protected handleTransportError(): ApiError {
        return {
          success: false,
          errorMessage: 'Test error',
          errorCode: 'UNKNOWN_ERROR',
          statusCode: 500,
          category: ErrorCategory.SERVER_ERROR,
          retryable: false,
        };
      }
    }

    const client = new TestApiClient();
    expect(client).toBeInstanceOf(BaseApiClient);
  });
});
