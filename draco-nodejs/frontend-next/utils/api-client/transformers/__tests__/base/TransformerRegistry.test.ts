import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';
import {
  TransformerRegistry,
  globalTransformerRegistry,
  registerTransformer,
  getTransformer,
  findTransformer,
  TransformerMetadata,
} from '../../base/TransformerRegistry.js';
import { ZodTransformer } from '../../base/ZodTransformer.js';
import { DataTransformer } from '../../base/BaseTransformer.js';

// Mock data types for testing
interface MockApiData {
  id: string;
  name: string;
  value: number;
}

interface MockClientData {
  id: string;
  displayName: string;
  numericValue: number;
}

interface MockApiUser {
  userId: string;
  firstName: string;
  lastName: string;
}

interface MockClientUser {
  id: string;
  fullName: string;
}

// Test schemas and transformers
const mockSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    value: z.number(),
  })
  .transform((api) => ({
    id: api.id,
    displayName: api.name,
    numericValue: api.value,
  }));

const mockUserSchema = z
  .object({
    userId: z.string(),
    firstName: z.string(),
    lastName: z.string(),
  })
  .transform((api) => ({
    id: api.userId,
    fullName: `${api.firstName} ${api.lastName}`,
  }));

describe('TransformerRegistry', () => {
  let registry: TransformerRegistry;
  let mockTransformer: DataTransformer<MockApiData, MockClientData>;
  let mockUserTransformer: DataTransformer<MockApiUser, MockClientUser>;

  beforeEach(() => {
    registry = new TransformerRegistry();
    mockTransformer = new ZodTransformer(mockSchema);
    mockUserTransformer = new ZodTransformer(mockUserSchema);
  });

  describe('register', () => {
    it('should successfully register a transformer', () => {
      const metadata: TransformerMetadata = {
        id: 'test-transformer',
        name: 'Test Transformer',
        description: 'A test transformer',
        version: '1.0.0',
        tags: ['test', 'mock'],
        sourceType: 'MockApiData',
        targetType: 'MockClientData',
      };

      const result = registry.register(mockTransformer, metadata);
      expect(result).toBe(true);
    });

    it('should prevent duplicate registration without allowOverwrite', () => {
      const metadata: TransformerMetadata = {
        id: 'test-transformer',
        name: 'Test Transformer',
        description: 'A test transformer',
        version: '1.0.0',
        tags: ['test', 'mock'],
        sourceType: 'MockApiData',
        targetType: 'MockClientData',
      };

      // Register first time
      registry.register(mockTransformer, metadata);

      // Try to register again
      const result = registry.register(mockTransformer, metadata);
      expect(result).toBe(false);
    });

    it('should allow overwrite when explicitly requested', () => {
      const metadata: TransformerMetadata = {
        id: 'test-transformer',
        name: 'Test Transformer',
        description: 'A test transformer',
        version: '1.0.0',
        tags: ['test', 'mock'],
        sourceType: 'MockApiData',
        targetType: 'MockClientData',
      };

      // Register first time
      registry.register(mockTransformer, metadata);

      // Register again with allowOverwrite
      const result = registry.register(mockTransformer, metadata, { allowOverwrite: true });
      expect(result).toBe(true);
    });

    it('should wrap transformer in SafeTransformer when makeSafe is true', () => {
      const metadata: TransformerMetadata = {
        id: 'safe-transformer',
        name: 'Safe Test Transformer',
        description: 'A safe test transformer',
        version: '1.0.0',
        tags: ['test', 'safe'],
        sourceType: 'MockApiData',
        targetType: 'MockClientData',
      };

      const result = registry.register(mockTransformer, metadata, { makeSafe: true });
      expect(result).toBe(true);

      const retrieved = registry.get('safe-transformer');
      expect(retrieved).toBeDefined();
      // Should be wrapped, so not the same instance
      expect(retrieved).not.toBe(mockTransformer);
    });
  });

  describe('registerZodTransformer', () => {
    it('should register Zod transformer with auto-generated metadata', () => {
      const result = registry.registerZodTransformer(
        'zod-transformer',
        mockSchema,
        'MockApiData',
        'MockClientData',
      );

      expect(result).toBe(true);

      const metadata = registry.getMetadata('zod-transformer');
      expect(metadata).toMatchObject({
        id: 'zod-transformer',
        name: 'MockApiData → MockClientData',
        sourceType: 'MockApiData',
        targetType: 'MockClientData',
        tags: expect.arrayContaining(['mockapidata', 'mockclientdata', 'zod']),
      });
    });

    it('should register Zod transformer with custom metadata', () => {
      const result = registry.registerZodTransformer(
        'custom-zod-transformer',
        mockSchema,
        'MockApiData',
        'MockClientData',
        {
          name: 'Custom Transformer',
          description: 'Custom description',
          version: '2.0.0',
          tags: ['custom', 'special'],
        },
      );

      expect(result).toBe(true);

      const metadata = registry.getMetadata('custom-zod-transformer');
      expect(metadata).toMatchObject({
        id: 'custom-zod-transformer',
        name: 'Custom Transformer',
        description: 'Custom description',
        version: '2.0.0',
        tags: ['custom', 'special'],
      });
    });
  });

  describe('get', () => {
    beforeEach(() => {
      const metadata: TransformerMetadata = {
        id: 'test-transformer',
        name: 'Test Transformer',
        description: 'A test transformer',
        version: '1.0.0',
        tags: ['test'],
        sourceType: 'MockApiData',
        targetType: 'MockClientData',
      };
      registry.register(mockTransformer, metadata);
    });

    it('should retrieve registered transformer', () => {
      const retrieved = registry.get('test-transformer');
      expect(retrieved).toBe(mockTransformer);
    });

    it('should return undefined for non-existent transformer', () => {
      const retrieved = registry.get('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it.skipIf(process.env.NODE_ENV !== 'development')(
      'should warn about deprecated transformers in development',
      () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});

        try {
          // Mark as deprecated
          registry.deprecate('test-transformer', 'Use new version');

          // Get transformer
          registry.get('test-transformer');

          expect(console.warn).toHaveBeenCalledWith(
            expect.stringContaining("Using deprecated transformer 'test-transformer'"),
          );
        } finally {
          vi.restoreAllMocks();
        }
      },
    );
  });

  describe('search', () => {
    beforeEach(() => {
      // Register multiple transformers for testing
      const metadata1: TransformerMetadata = {
        id: 'data-transformer',
        name: 'Data Transformer',
        description: 'Transforms data objects',
        version: '1.0.0',
        tags: ['data', 'transform'],
        sourceType: 'MockApiData',
        targetType: 'MockClientData',
      };

      const metadata2: TransformerMetadata = {
        id: 'user-transformer',
        name: 'User Transformer',
        description: 'Transforms user objects',
        version: '1.1.0',
        tags: ['user', 'transform'],
        sourceType: 'MockApiUser',
        targetType: 'MockClientUser',
      };

      const metadata3: TransformerMetadata = {
        id: 'deprecated-transformer',
        name: 'Deprecated Transformer',
        description: 'Old transformer',
        version: '0.9.0',
        tags: ['old'],
        sourceType: 'MockApiData',
        targetType: 'MockClientData',
        deprecated: true,
      };

      registry.register(mockTransformer, metadata1);
      registry.register(mockUserTransformer, metadata2);
      registry.register(mockTransformer, metadata3);
    });

    it('should find transformers by ID', () => {
      const results = registry.search({ id: 'data-transformer' });
      expect(results).toHaveLength(1);
      expect(results[0].metadata.id).toBe('data-transformer');
    });

    it('should find transformers by source type', () => {
      const results = registry.search({ sourceType: 'MockApiData' });
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.every((r) => r.metadata.sourceType === 'MockApiData')).toBe(true);
    });

    it('should find transformers by target type', () => {
      const results = registry.search({ targetType: 'MockClientUser' });
      expect(results).toHaveLength(1);
      expect(results[0].metadata.targetType).toBe('MockClientUser');
    });

    it('should find transformers by tags', () => {
      const results = registry.search({ tags: ['user'] });
      expect(results).toHaveLength(1);
      expect(results[0].metadata.tags).toContain('user');
    });

    it('should find transformers by query', () => {
      const results = registry.search({ query: 'user' });
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(
        results.some(
          (r) =>
            r.metadata.name.toLowerCase().includes('user') ||
            r.metadata.description.toLowerCase().includes('user'),
        ),
      ).toBe(true);
    });

    it('should exclude deprecated transformers by default', () => {
      const results = registry.search({ sourceType: 'MockApiData' });
      expect(results.every((r) => !r.metadata.deprecated)).toBe(true);
    });

    it('should include deprecated transformers when requested', () => {
      const results = registry.search({
        sourceType: 'MockApiData',
        includeDeprecated: true,
      });
      expect(results.some((r) => r.metadata.deprecated)).toBe(true);
    });

    it('should filter by minimum version', () => {
      const results = registry.search({ minVersion: '1.0.0' });
      expect(
        results.every((r) => {
          const version = r.metadata.version.split('.').map(Number);
          return version[0] >= 1 && (version[0] > 1 || version[1] >= 0);
        }),
      ).toBe(true);
    });

    it('should sort results by usage count and creation date', () => {
      // Use some transformers to create usage differences
      registry.get('data-transformer');
      registry.get('data-transformer');
      registry.get('user-transformer');

      const results = registry.search({});

      // Should be sorted with most used first
      if (results.length > 1) {
        expect(results[0].usageCount).toBeGreaterThanOrEqual(results[1].usageCount);
      }
    });
  });

  describe('findTransformer', () => {
    beforeEach(() => {
      const metadata: TransformerMetadata = {
        id: 'data-transformer',
        name: 'Data Transformer',
        description: 'Transforms data objects',
        version: '1.0.0',
        tags: ['data'],
        sourceType: 'MockApiData',
        targetType: 'MockClientData',
      };
      registry.register(mockTransformer, metadata);
    });

    it('should find transformer for specific type transformation', () => {
      const transformer = registry.findTransformer('MockApiData', 'MockClientData');
      expect(transformer).toBe(mockTransformer);
    });

    it('should return undefined for non-existent type transformation', () => {
      const transformer = registry.findTransformer('NonExistent', 'AlsoNonExistent');
      expect(transformer).toBeUndefined();
    });
  });

  describe('getSourceTypes', () => {
    beforeEach(() => {
      const metadata1: TransformerMetadata = {
        id: 'data-transformer',
        name: 'Data Transformer',
        description: 'Transforms data',
        version: '1.0.0',
        tags: ['data'],
        sourceType: 'MockApiData',
        targetType: 'MockClientData',
      };

      const metadata2: TransformerMetadata = {
        id: 'user-transformer',
        name: 'User Transformer',
        description: 'Transforms users',
        version: '1.0.0',
        tags: ['user'],
        sourceType: 'MockApiUser',
        targetType: 'MockClientUser',
      };

      registry.register(mockTransformer, metadata1);
      registry.register(mockUserTransformer, metadata2);
    });

    it('should return all source types', () => {
      const sourceTypes = registry.getSourceTypes();
      expect(sourceTypes).toContain('MockApiData');
      expect(sourceTypes).toContain('MockApiUser');
    });
  });

  describe('getTargetTypes', () => {
    beforeEach(() => {
      const metadata1: TransformerMetadata = {
        id: 'data-transformer',
        name: 'Data Transformer',
        description: 'Transforms data',
        version: '1.0.0',
        tags: ['data'],
        sourceType: 'MockApiData',
        targetType: 'MockClientData',
      };

      const metadata2: TransformerMetadata = {
        id: 'user-transformer',
        name: 'User Transformer',
        description: 'Transforms users',
        version: '1.0.0',
        tags: ['user'],
        sourceType: 'MockApiUser',
        targetType: 'MockClientUser',
      };

      registry.register(mockTransformer, metadata1);
      registry.register(mockUserTransformer, metadata2);
    });

    it('should return all target types', () => {
      const targetTypes = registry.getTargetTypes();
      expect(targetTypes).toContain('MockClientData');
      expect(targetTypes).toContain('MockClientUser');
    });
  });

  describe('deprecate', () => {
    beforeEach(() => {
      const metadata: TransformerMetadata = {
        id: 'test-transformer',
        name: 'Test Transformer',
        description: 'A test transformer',
        version: '1.0.0',
        tags: ['test'],
        sourceType: 'MockApiData',
        targetType: 'MockClientData',
      };
      registry.register(mockTransformer, metadata);
    });

    it('should mark transformer as deprecated', () => {
      const result = registry.deprecate('test-transformer', 'Use new version');
      expect(result).toBe(true);

      const metadata = registry.getMetadata('test-transformer');
      expect(metadata?.deprecated).toBe(true);
      expect(metadata?.deprecationMessage).toBe('Use new version');
    });

    it('should return false for non-existent transformer', () => {
      const result = registry.deprecate('non-existent', 'Message');
      expect(result).toBe(false);
    });
  });

  describe('unregister', () => {
    beforeEach(() => {
      const metadata: TransformerMetadata = {
        id: 'test-transformer',
        name: 'Test Transformer',
        description: 'A test transformer',
        version: '1.0.0',
        tags: ['test'],
        sourceType: 'MockApiData',
        targetType: 'MockClientData',
      };
      registry.register(mockTransformer, metadata);
    });

    it('should remove transformer from registry', () => {
      const result = registry.unregister('test-transformer');
      expect(result).toBe(true);

      const retrieved = registry.get('test-transformer');
      expect(retrieved).toBeUndefined();
    });

    it('should return false for non-existent transformer', () => {
      const result = registry.unregister('non-existent');
      expect(result).toBe(false);
    });

    it('should clean up indexes', () => {
      registry.unregister('test-transformer');

      const sourceTypes = registry.getSourceTypes();
      const targetTypes = registry.getTargetTypes();

      // These should be empty since we only had one transformer
      expect(sourceTypes).toHaveLength(0);
      expect(targetTypes).toHaveLength(0);
    });
  });

  describe('clear', () => {
    beforeEach(() => {
      const metadata: TransformerMetadata = {
        id: 'test-transformer',
        name: 'Test Transformer',
        description: 'A test transformer',
        version: '1.0.0',
        tags: ['test'],
        sourceType: 'MockApiData',
        targetType: 'MockClientData',
      };
      registry.register(mockTransformer, metadata);
    });

    it('should clear all transformers', () => {
      registry.clear();

      const retrieved = registry.get('test-transformer');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getStats', () => {
    beforeEach(() => {
      const metadata1: TransformerMetadata = {
        id: 'active-transformer',
        name: 'Active Transformer',
        description: 'Active',
        version: '1.0.0',
        tags: ['active'],
        sourceType: 'MockApiData',
        targetType: 'MockClientData',
      };

      const metadata2: TransformerMetadata = {
        id: 'deprecated-transformer',
        name: 'Deprecated Transformer',
        description: 'Deprecated',
        version: '0.9.0',
        tags: ['old'],
        sourceType: 'MockApiData',
        targetType: 'MockClientData',
        deprecated: true,
      };

      registry.register(mockTransformer, metadata1);
      registry.register(mockTransformer, metadata2);

      // Use one transformer to create usage
      registry.get('active-transformer');
      registry.get('active-transformer');
    });
  });
});

describe('Global Registry', () => {
  beforeEach(() => {
    // Clear global registry before each test
    globalTransformerRegistry.clear();
  });

  describe('registerTransformer', () => {
    it('should register transformer in global registry', () => {
      const metadata: TransformerMetadata = {
        id: 'global-transformer',
        name: 'Global Transformer',
        description: 'A global test transformer',
        version: '1.0.0',
        tags: ['global'],
        sourceType: 'MockApiData',
        targetType: 'MockClientData',
      };

      const result = registerTransformer(new ZodTransformer(mockSchema), metadata);
      expect(result).toBe(true);
    });
  });

  describe('getTransformer', () => {
    it('should get transformer from global registry', () => {
      const metadata: TransformerMetadata = {
        id: 'global-transformer',
        name: 'Global Transformer',
        description: 'A global test transformer',
        version: '1.0.0',
        tags: ['global'],
        sourceType: 'MockApiData',
        targetType: 'MockClientData',
      };

      const transformer = new ZodTransformer(mockSchema);
      registerTransformer(transformer, metadata);

      const retrieved = getTransformer('global-transformer');
      expect(retrieved).toBe(transformer);
    });
  });

  describe('findTransformer', () => {
    it('should find transformer in global registry', () => {
      const metadata: TransformerMetadata = {
        id: 'global-transformer',
        name: 'Global Transformer',
        description: 'A global test transformer',
        version: '1.0.0',
        tags: ['global'],
        sourceType: 'MockApiData',
        targetType: 'MockClientData',
      };

      const transformer = new ZodTransformer(mockSchema);
      registerTransformer(transformer, metadata);

      const found = findTransformer('MockApiData', 'MockClientData');
      expect(found).toBe(transformer);
    });
  });
});
