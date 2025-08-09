import { PaginationHelper } from '../pagination.js';
import { describe, it, expect } from 'vitest';

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
});
