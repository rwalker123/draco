import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  BaseTransformer,
  AsyncBaseTransformer,
  TransformationError,
} from '../../base/BaseTransformer';

// Mock API and Client types for testing
interface MockApiData {
  id: string;
  name: string;
  value: number;
}

interface MockClientData {
  id: string;
  displayName: string;
  numericValue: number;
  computed: boolean;
}

// Concrete implementation for testing
class TestTransformer extends BaseTransformer<MockApiData, MockClientData> {
  public readonly schema = z
    .object({
      id: z.string(),
      name: z.string(),
      value: z.number(),
    })
    .transform((api) => ({
      id: api.id,
      displayName: api.name,
      numericValue: api.value,
      computed: true,
    }));
}

// Concrete async implementation for testing
class TestAsyncTransformer extends AsyncBaseTransformer<MockApiData, MockClientData> {
  public readonly schema = z
    .object({
      id: z.string(),
      name: z.string(),
      value: z.number(),
    })
    .transform((api) => ({
      id: api.id,
      displayName: api.name,
      numericValue: api.value,
      computed: true,
    }));

  public async transform(apiData: MockApiData): Promise<MockClientData> {
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 1));
    return this.schema.parse(apiData);
  }
}

describe('BaseTransformer', () => {
  let transformer: TestTransformer;

  beforeEach(() => {
    transformer = new TestTransformer();
  });

  describe('transform', () => {
    it('should transform valid API data to client format', () => {
      const apiData: MockApiData = {
        id: '123',
        name: 'Test Item',
        value: 42,
      };

      const result = transformer.transform(apiData);

      expect(result).toEqual({
        id: '123',
        displayName: 'Test Item',
        numericValue: 42,
        computed: true,
      });
    });
  });

  describe('transformList', () => {
    it('should transform array of API data', () => {
      const apiDataList: MockApiData[] = [
        { id: '1', name: 'Item 1', value: 10 },
        { id: '2', name: 'Item 2', value: 20 },
      ];

      const result = transformer.transformList(apiDataList);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '1',
        displayName: 'Item 1',
        numericValue: 10,
        computed: true,
      });
      expect(result[1]).toEqual({
        id: '2',
        displayName: 'Item 2',
        numericValue: 20,
        computed: true,
      });
    });

    it('should handle empty array', () => {
      const result = transformer.transformList([]);
      expect(result).toEqual([]);
    });
  });

  describe('validate', () => {
    it('should validate and transform unknown data', () => {
      const unknownData: unknown = {
        id: '123',
        name: 'Test Item',
        value: 42,
      };

      const result = transformer.validate(unknownData);

      expect(result).toEqual({
        id: '123',
        displayName: 'Test Item',
        numericValue: 42,
        computed: true,
      });
    });
  });

  describe('safeValidate', () => {
    it('should return transformed data for valid input', () => {
      const validData = {
        id: '123',
        name: 'Test Item',
        value: 42,
      };

      const result = transformer['safeValidate'](validData);

      expect(result).toEqual({
        id: '123',
        displayName: 'Test Item',
        numericValue: 42,
        computed: true,
      });
    });
  });

  describe('isValid', () => {
    it('should return true for valid data', () => {
      const validData = {
        id: '123',
        name: 'Test Item',
        value: 42,
      };

      expect(transformer.isValid(validData)).toBe(true);
    });
  });

  describe('getValidationErrors', () => {
    it('should return empty array for valid data', () => {
      const validData = {
        id: '123',
        name: 'Test Item',
        value: 42,
      };

      const errors = transformer.getValidationErrors(validData);
      expect(errors).toEqual([]);
    });
  });
});

describe('AsyncBaseTransformer', () => {
  let transformer: TestAsyncTransformer;

  beforeEach(() => {
    transformer = new TestAsyncTransformer();
  });

  describe('transform', () => {
    it('should transform valid API data asynchronously', async () => {
      const apiData: MockApiData = {
        id: '123',
        name: 'Test Item',
        value: 42,
      };

      const result = await transformer.transform(apiData);

      expect(result).toEqual({
        id: '123',
        displayName: 'Test Item',
        numericValue: 42,
        computed: true,
      });
    });
  });

  describe('transformList', () => {
    it('should transform array of API data asynchronously', async () => {
      const apiDataList: MockApiData[] = [
        { id: '1', name: 'Item 1', value: 10 },
        { id: '2', name: 'Item 2', value: 20 },
      ];

      const result = await transformer.transformList(apiDataList);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '1',
        displayName: 'Item 1',
        numericValue: 10,
        computed: true,
      });
      expect(result[1]).toEqual({
        id: '2',
        displayName: 'Item 2',
        numericValue: 20,
        computed: true,
      });
    });

    it('should handle empty array asynchronously', async () => {
      const result = await transformer.transformList([]);
      expect(result).toEqual([]);
    });
  });

  describe('validate', () => {
    it('should validate synchronously even for async transformer', () => {
      const unknownData: unknown = {
        id: '123',
        name: 'Test Item',
        value: 42,
      };

      const result = transformer.validate(unknownData);

      expect(result).toEqual({
        id: '123',
        displayName: 'Test Item',
        numericValue: 42,
        computed: true,
      });
    });
  });
});

describe('TransformationError', () => {
  it('should create error with message and original data', () => {
    const originalData = { id: '123' };
    const error = new TransformationError('Test error', originalData);

    expect(error.name).toBe('TransformationError');
    expect(error.message).toBe('Test error');
    expect(error.originalData).toBe(originalData);
  });

  it('should create error with cause', () => {
    const originalData = { id: '123' };
    const cause = new Error('Root cause');
    const error = new TransformationError('Test error', originalData, cause);

    expect(error.cause).toBe(cause);
  });
});

describe('Performance', () => {
  let transformer: TestTransformer;

  beforeEach(() => {
    transformer = new TestTransformer();
  });

  it('should transform 1000 items in under 50ms', () => {
    const apiDataList: MockApiData[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `${i}`,
      name: `Item ${i}`,
      value: i,
    }));

    const startTime = performance.now();
    const result = transformer.transformList(apiDataList);
    const endTime = performance.now();

    const transformationTime = endTime - startTime;

    expect(result).toHaveLength(1000);
    expect(transformationTime).toBeLessThan(50);
  });

  it('should not significantly increase memory usage for large datasets', () => {
    const initialMemory = process.memoryUsage().heapUsed;

    const apiDataList: MockApiData[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `${i}`,
      name: `Item ${i}`,
      value: i,
    }));

    const result = transformer.transformList(apiDataList);

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    expect(result).toHaveLength(1000);
    // Memory increase should be reasonable (less than 10MB for 1000 items)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });
});
