/**
 * Security tests for BaseApiClient FormData sanitization
 * Tests XSS prevention in file upload form data
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BaseApiClient } from './BaseApiClient.js';
import type { HttpMethod, RequestData, RequestOptions } from './types/index.js';
import type { ClientResponse } from './types/responses.js';
import type { ApiResponse, ApiError } from '@draco/shared-types';

// Mock implementation for testing
class TestApiClient extends BaseApiClient {
  public lastFormData: FormData | null = null;

  protected async executeRequest<TResponse>(
    method: HttpMethod,
    _url: string,
    data?: RequestData,
    _options?: RequestOptions,
  ): Promise<TResponse> {
    // Capture FormData for inspection
    if (data instanceof FormData) {
      this.lastFormData = data;
    }

    // Return mock success response
    return { success: true, data: {} } as TResponse;
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

    return {
      success: true,
      data: response,
      statusCode: 200,
    };
  }

  protected handleTransportError(
    error: unknown,
    _url: string,
    _options?: RequestOptions,
  ): ApiError {
    return {
      success: false,
      errorCode: 'UNKNOWN_ERROR',
      errorMessage: error instanceof Error ? error.message : 'Test error',
      statusCode: 500,
      category: 'SERVER_ERROR' as ApiError['category'],
      retryable: false,
    };
  }
}

describe('BaseApiClient Security Tests', () => {
  let client: TestApiClient;
  let mockFile: File;

  beforeEach(() => {
    client = new TestApiClient();
    mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
  });

  describe('uploadFile FormData Sanitization', () => {
    it('should sanitize script tags in form data values', async () => {
      const maliciousData = {
        description: '<script>alert("xss")</script>Safe content',
        category: 'test',
      };

      await client.uploadFile('/api/upload', mockFile, maliciousData);

      expect(client.lastFormData).toBeDefined();
      const formDataValues = Array.from(client.lastFormData!.entries());

      const descriptionEntry = formDataValues.find(([key]) => key === 'description');
      expect(descriptionEntry).toBeDefined();
      expect(descriptionEntry![1]).toBe('Safe content'); // Script tag removed

      const categoryEntry = formDataValues.find(([key]) => key === 'category');
      expect(categoryEntry![1]).toBe('test'); // Normal content preserved
    });

    it('should sanitize HTML event handlers', async () => {
      const maliciousData = {
        title: '<div onclick="alert(\'xss\')">Click me</div>',
        message: '<img onload="steal()" src="x">',
      };

      await client.uploadFile('/api/upload', mockFile, maliciousData);

      const formDataValues = Array.from(client.lastFormData!.entries());

      const titleEntry = formDataValues.find(([key]) => key === 'title');
      expect(titleEntry![1]).toBe('Click me'); // Event handler and tags removed

      const messageEntry = formDataValues.find(([key]) => key === 'message');
      expect(messageEntry![1]).toBe(''); // Dangerous img tag completely removed
    });

    it('should sanitize dangerous HTML tags', async () => {
      const maliciousData = {
        content: '<iframe src="javascript:alert(1)"></iframe>Normal text',
        embed: '<object data="evil.swf"></object>',
        style: '<style>body{background:url(javascript:alert(1))}</style>Safe',
      };

      await client.uploadFile('/api/upload', mockFile, maliciousData);

      const formDataValues = Array.from(client.lastFormData!.entries());

      const contentEntry = formDataValues.find(([key]) => key === 'content');
      expect(contentEntry![1]).toBe('Normal text');

      const embedEntry = formDataValues.find(([key]) => key === 'embed');
      expect(embedEntry![1]).toBe('');

      const styleEntry = formDataValues.find(([key]) => key === 'style');
      expect(styleEntry![1]).toBe('Safe');
    });

    it('should handle non-string values safely', async () => {
      const mixedData = {
        count: 42,
        active: true,
        price: 19.99,
        tags: null,
        metadata: undefined,
        description: '<script>alert("xss")</script>Clean text',
      };

      await client.uploadFile('/api/upload', mockFile, mixedData);

      const formDataValues = Array.from(client.lastFormData!.entries());

      // Non-string values should be converted to string without sanitization
      const countEntry = formDataValues.find(([key]) => key === 'count');
      expect(countEntry![1]).toBe('42');

      const activeEntry = formDataValues.find(([key]) => key === 'active');
      expect(activeEntry![1]).toBe('true');

      const priceEntry = formDataValues.find(([key]) => key === 'price');
      expect(priceEntry![1]).toBe('19.99');

      // String values should be sanitized
      const descriptionEntry = formDataValues.find(([key]) => key === 'description');
      expect(descriptionEntry![1]).toBe('Clean text');

      // null/undefined should not be included
      const tagsEntry = formDataValues.find(([key]) => key === 'tags');
      expect(tagsEntry).toBeUndefined();

      const metadataEntry = formDataValues.find(([key]) => key === 'metadata');
      expect(metadataEntry).toBeUndefined();
    });

    it('should preserve legitimate content', async () => {
      const legitimateData = {
        title: 'Team Registration Form',
        description: 'Please fill out all fields completely.',
        email: 'user@example.com',
        phone: '+1-555-123-4567',
        address: '123 Main St, City, State 12345',
      };

      await client.uploadFile('/api/upload', mockFile, legitimateData);

      const formDataValues = Array.from(client.lastFormData!.entries());

      // All legitimate content should be preserved exactly
      expect(formDataValues.find(([key]) => key === 'title')![1]).toBe(legitimateData.title);

      expect(formDataValues.find(([key]) => key === 'description')![1]).toBe(
        legitimateData.description,
      );

      expect(formDataValues.find(([key]) => key === 'email')![1]).toBe(legitimateData.email);
    });

    it('should handle complex XSS payloads', async () => {
      const complexXssPayloads = [
        '<script>eval(String.fromCharCode(97,108,101,114,116,40,39,88,83,83,39,41))</script>',
        '<img src=x onerror="alert(\'xss\')">',
        'javascript:alert(document.cookie)',
        '<svg onload="alert(1)">',
        '<iframe srcdoc="<script>alert(\'xss\')</script>">',
        "<math><script>alert('xss')</script></math>",
      ];

      for (const [index, payload] of complexXssPayloads.entries()) {
        const data = { [`field${index}`]: payload };
        await client.uploadFile('/api/upload', mockFile, data);

        const formDataValues = Array.from(client.lastFormData!.entries());
        const fieldEntry = formDataValues.find(([key]) => key === `field${index}`);

        // All XSS payloads should be sanitized to safe content or empty string
        expect(fieldEntry![1]).not.toContain('<script');
        expect(fieldEntry![1]).not.toContain('onerror');
        expect(fieldEntry![1]).not.toContain('javascript:');
        expect(fieldEntry![1]).not.toContain('onload');
        expect(fieldEntry![1]).not.toContain('<iframe');
        expect(fieldEntry![1]).not.toContain('<svg');
        expect(fieldEntry![1]).not.toContain('<math');
      }
    });

    it('should handle empty and edge case data', async () => {
      const edgeCaseData = {
        empty: '',
        whitespace: '   ',
        specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
      };

      await client.uploadFile('/api/upload', mockFile, edgeCaseData);

      const formDataValues = Array.from(client.lastFormData!.entries());

      const emptyEntry = formDataValues.find(([key]) => key === 'empty');
      expect(emptyEntry![1]).toBe('');

      const whitespaceEntry = formDataValues.find(([key]) => key === 'whitespace');
      expect(whitespaceEntry![1]).toBe('   '); // Whitespace should be preserved

      const specialCharsEntry = formDataValues.find(([key]) => key === 'specialChars');
      expect(specialCharsEntry![1]).toBe('!@#$%^&*()_+-=[]{}|;:,.<>?'); // Special chars preserved
    });

    it('should work when no additional data is provided', async () => {
      await client.uploadFile('/api/upload', mockFile);

      expect(client.lastFormData).toBeDefined();
      const formDataValues = Array.from(client.lastFormData!.entries());

      // Should only contain the file entry
      const fileEntry = formDataValues.find(([key]) => key === 'file');
      expect(fileEntry).toBeDefined();
      expect(fileEntry![1]).toBeInstanceOf(File);

      // Should not have any additional data entries
      expect(formDataValues).toHaveLength(1);
    });
  });
});
