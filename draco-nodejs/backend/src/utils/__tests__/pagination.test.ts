import { PaginationHelper } from '../pagination.js';
import { describe, it, expect, vi } from 'vitest';

describe('PaginationHelper', () => {
  describe('parseParams', () => {
    it('should use default values for empty query', () => {
      const result = PaginationHelper.parseParams({});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
      expect(result.skip).toBe(0);
      expect(result.sortOrder).toBe('asc');
      expect(result.sortBy).toBeUndefined();
    });

    it('should parse valid pagination parameters', () => {
      const query = {
        page: '2',
        limit: '25',
        sortBy: 'name',
        sortOrder: 'desc',
      };

      const result = PaginationHelper.parseParams(query);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(25);
      expect(result.skip).toBe(25); // (2-1) * 25
      expect(result.sortBy).toBe('name');
      expect(result.sortOrder).toBe('desc');
    });

    it('should enforce minimum page of 1', () => {
      const result = PaginationHelper.parseParams({ page: '0' });
      expect(result.page).toBe(1);
    });

    it('should enforce maximum limit of 100', () => {
      const result = PaginationHelper.parseParams({ limit: '200' });
      expect(result.limit).toBe(100);
    });

    it('should enforce minimum limit of 1', () => {
      const result = PaginationHelper.parseParams({ limit: '0' });
      expect(result.limit).toBe(50); // Falls back to default when invalid
    });

    it('should handle invalid string inputs', () => {
      const query = {
        page: 'invalid',
        limit: 'invalid',
        sortOrder: 'invalid',
      };

      const result = PaginationHelper.parseParams(query);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
      expect(result.sortOrder).toBe('asc');
    });
  });

  describe('createMeta', () => {
    it('should create correct pagination metadata', () => {
      const meta = PaginationHelper.createMeta(2, 10, 25);

      expect(meta.page).toBe(2);
      expect(meta.limit).toBe(10);
      expect(meta.total).toBe(25);
      expect(meta.totalPages).toBe(3);
      expect(meta.hasNext).toBe(true);
      expect(meta.hasPrev).toBe(true);
    });

    it('should handle first page correctly', () => {
      const meta = PaginationHelper.createMeta(1, 10, 25);

      expect(meta.hasNext).toBe(true);
      expect(meta.hasPrev).toBe(false);
    });

    it('should handle last page correctly', () => {
      const meta = PaginationHelper.createMeta(3, 10, 25);

      expect(meta.hasNext).toBe(false);
      expect(meta.hasPrev).toBe(true);
    });

    it('should handle single page correctly', () => {
      const meta = PaginationHelper.createMeta(1, 10, 5);

      expect(meta.totalPages).toBe(1);
      expect(meta.hasNext).toBe(false);
      expect(meta.hasPrev).toBe(false);
    });
  });

  describe('formatResponse', () => {
    it('should format paginated response correctly', () => {
      const data = ['item1', 'item2', 'item3'];
      const response = PaginationHelper.formatResponse(data, 1, 10, 25);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.pagination.page).toBe(1);
      expect(response.pagination.limit).toBe(10);
      expect(response.pagination.total).toBe(25);
    });
  });

  describe('getPrismaOrderBy', () => {
    it('should return default sort when sortBy is undefined', () => {
      const result = PaginationHelper.getPrismaOrderBy();
      expect(result).toEqual({ id: 'asc' });
    });

    it('should handle simple field sorting', () => {
      const result = PaginationHelper.getPrismaOrderBy('name', 'desc');
      expect(result).toEqual({ name: 'desc' });
    });

    it('should handle nested field sorting', () => {
      const result = PaginationHelper.getPrismaOrderBy('user.name', 'asc');
      expect(result).toEqual({ user: { name: 'asc' } });
    });

    it('should handle deeply nested field sorting', () => {
      const result = PaginationHelper.getPrismaOrderBy('user.profile.name', 'desc');
      expect(result).toEqual({ user: { profile: { name: 'desc' } } });
    });
  });

  describe('validateSortField', () => {
    const allowedFields = ['name', 'email', 'user.name', 'createdAt'];

    it('should return undefined for undefined sortBy', () => {
      const result = PaginationHelper.validateSortField(undefined, allowedFields);
      expect(result).toBeUndefined();
    });

    it('should return sortBy if it is in allowed fields', () => {
      const result = PaginationHelper.validateSortField('name', allowedFields);
      expect(result).toBe('name');
    });

    it('should return undefined if sortBy is not in allowed fields', () => {
      const result = PaginationHelper.validateSortField('invalidField', allowedFields);
      expect(result).toBeUndefined();
    });

    it('should handle nested fields', () => {
      const result = PaginationHelper.validateSortField('user.name', allowedFields);
      expect(result).toBe('user.name');
    });

    it('should validate base field for nested sorting', () => {
      const result = PaginationHelper.validateSortField('user.profile', allowedFields);
      expect(result).toBeUndefined(); // 'user.profile' is not in allowed fields
    });
  });

  describe('executePaginatedQuery', () => {
    it('should execute paginated query without transformation', async () => {
      const mockItems = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];
      const mockTotal = 100;

      const queryFn = vi.fn().mockResolvedValue(mockItems);
      const countFn = vi.fn().mockResolvedValue(mockTotal);

      const result = await PaginationHelper.executePaginatedQuery(queryFn, countFn);

      expect(queryFn).toHaveBeenCalledOnce();
      expect(countFn).toHaveBeenCalledOnce();
      expect(result.data).toEqual(mockItems);
      expect(result.total).toBe(mockTotal);
    });

    it('should execute paginated query with transformation', async () => {
      const mockItems = [
        { id: 1, name: 'Item 1', value: 10 },
        { id: 2, name: 'Item 2', value: 20 },
      ];
      const mockTotal = 50;
      const expectedTransformed = [
        { id: 1, displayName: 'Item 1', doubledValue: 20 },
        { id: 2, displayName: 'Item 2', doubledValue: 40 },
      ];

      const queryFn = vi.fn().mockResolvedValue(mockItems);
      const countFn = vi.fn().mockResolvedValue(mockTotal);
      const transformFn = vi.fn().mockImplementation((items: any[]) =>
        items.map((item: any) => ({
          id: item.id,
          displayName: item.name,
          doubledValue: item.value * 2,
        })),
      );

      const result = await PaginationHelper.executePaginatedQuery(queryFn, countFn, transformFn);

      expect(queryFn).toHaveBeenCalledOnce();
      expect(countFn).toHaveBeenCalledOnce();
      expect(transformFn).toHaveBeenCalledWith(mockItems);
      expect(result.data).toEqual(expectedTransformed);
      expect(result.total).toBe(mockTotal);
    });

    it('should handle query function errors gracefully', async () => {
      const mockError = new Error('Database query failed');
      const queryFn = vi.fn().mockRejectedValue(mockError);
      const countFn = vi.fn().mockResolvedValue(10);

      await expect(PaginationHelper.executePaginatedQuery(queryFn, countFn)).rejects.toThrow(
        'Database query failed',
      );

      expect(queryFn).toHaveBeenCalledOnce();
      // countFn might or might not be called depending on Promise.all implementation
    });

    it('should handle count function errors gracefully', async () => {
      const mockItems = [{ id: 1 }];
      const mockError = new Error('Count query failed');
      const queryFn = vi.fn().mockResolvedValue(mockItems);
      const countFn = vi.fn().mockRejectedValue(mockError);

      await expect(PaginationHelper.executePaginatedQuery(queryFn, countFn)).rejects.toThrow(
        'Count query failed',
      );

      expect(countFn).toHaveBeenCalledOnce();
      // queryFn might or might not be called depending on Promise.all implementation
    });

    it('should handle transformation function errors gracefully', async () => {
      const mockItems = [{ id: 1, name: 'Item 1' }];
      const mockTotal = 10;
      const mockError = new Error('Transformation failed');

      const queryFn = vi.fn().mockResolvedValue(mockItems);
      const countFn = vi.fn().mockResolvedValue(mockTotal);
      const transformFn = vi.fn().mockImplementation(() => {
        throw mockError;
      });

      await expect(
        PaginationHelper.executePaginatedQuery(queryFn, countFn, transformFn),
      ).rejects.toThrow('Transformation failed');

      expect(queryFn).toHaveBeenCalledOnce();
      expect(countFn).toHaveBeenCalledOnce();
      expect(transformFn).toHaveBeenCalledWith(mockItems);
    });

    it('should handle empty query results', async () => {
      const queryFn = vi.fn().mockResolvedValue([]);
      const countFn = vi.fn().mockResolvedValue(0);

      const result = await PaginationHelper.executePaginatedQuery(queryFn, countFn);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle transformation of empty results', async () => {
      const queryFn = vi.fn().mockResolvedValue([]);
      const countFn = vi.fn().mockResolvedValue(0);
      const transformFn = vi
        .fn()
        .mockImplementation((items: any[]) => items.map((item: any) => ({ transformed: item })));

      const result = await PaginationHelper.executePaginatedQuery(queryFn, countFn, transformFn);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(transformFn).toHaveBeenCalledWith([]);
    });

    it('should handle large datasets with transformation', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
      }));
      const mockTotal = 5000;

      const queryFn = vi.fn().mockResolvedValue(largeDataset);
      const countFn = vi.fn().mockResolvedValue(mockTotal);
      const transformFn = vi
        .fn()
        .mockImplementation((items: any[]) =>
          items.map((item: any) => ({ ...item, processed: true })),
        );

      const result = await PaginationHelper.executePaginatedQuery(queryFn, countFn, transformFn);

      expect(result.data).toHaveLength(1000);
      expect(result.data[0]).toEqual({ id: 1, name: 'Item 1', processed: true });
      expect(result.total).toBe(mockTotal);
    });

    it('should preserve original type safety when no transformation provided', async () => {
      interface TestItem {
        id: number;
        name: string;
        value: number;
      }

      const mockItems: TestItem[] = [
        { id: 1, name: 'Item 1', value: 100 },
        { id: 2, name: 'Item 2', value: 200 },
      ];
      const mockTotal = 25;

      const queryFn = vi.fn().mockResolvedValue(mockItems);
      const countFn = vi.fn().mockResolvedValue(mockTotal);

      const result = await PaginationHelper.executePaginatedQuery<TestItem>(queryFn, countFn);

      expect(result.data).toEqual(mockItems);
      expect(result.total).toBe(mockTotal);

      // Type safety check - these should be available without casting
      expect(result.data[0].id).toBe(1);
      expect(result.data[0].name).toBe('Item 1');
      expect(result.data[0].value).toBe(100);
    });

    it('should handle concurrent queries correctly', async () => {
      const queryFn1 = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve([{ id: 1 }]), 10)),
        );
      const countFn1 = vi
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(100), 5)));

      const queryFn2 = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve([{ id: 2 }]), 5)),
        );
      const countFn2 = vi
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(200), 10)));

      const [result1, result2] = await Promise.all([
        PaginationHelper.executePaginatedQuery(queryFn1, countFn1),
        PaginationHelper.executePaginatedQuery(queryFn2, countFn2),
      ]);

      expect(result1.data).toEqual([{ id: 1 }]);
      expect(result1.total).toBe(100);
      expect(result2.data).toEqual([{ id: 2 }]);
      expect(result2.total).toBe(200);
    });
  });
});
