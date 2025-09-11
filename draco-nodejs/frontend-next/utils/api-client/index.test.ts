import { describe, it, expect } from 'vitest';
import { BaseApiClient } from './index.js';
import type { ClientResponse } from './types/responses.js';
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
      protected async executeRequest<TResponse>(): Promise<TResponse> {
        return {} as TResponse;
      }

      protected transformResponse<T>(response: ApiResponse<T> | T): ClientResponse<T> {
        if (typeof response === 'object' && response !== null && 'success' in response) {
          const apiResponse = response as ApiResponse<T>;
          return {
            success: apiResponse.success,
            data: apiResponse.data,
            statusCode: 200,
          };
        }
        return { success: true, data: response };
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
