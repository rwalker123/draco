import { describe, it, expect } from 'vitest';
import { BaseApiClient } from './index.js';
import type { ClientResponse } from './types/responses.js';
import type { ApiError } from '@draco/shared-types';

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

      protected transformResponse<T>(response: T): ClientResponse<T> {
        return { success: true, data: response };
      }

      protected handleTransportError(): ApiError {
        return {
          success: false,
          errorMessage: 'Test error',
          errorCode: 'TEST_ERROR',
          statusCode: 500,
          category: 'SERVER_ERROR',
          retryable: false,
        };
      }
    }

    const client = new TestApiClient();
    expect(client).toBeInstanceOf(BaseApiClient);
  });
});
