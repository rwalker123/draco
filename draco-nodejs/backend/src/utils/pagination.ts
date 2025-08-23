/**
 * Pagination utilities for consistent pagination across the API
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

export class PaginationHelper {
  private static readonly DEFAULT_LIMIT = 50;
  private static readonly MAX_LIMIT = 100;
  private static readonly DEFAULT_PAGE = 1;

  /**
   * Parse and validate pagination parameters from query string
   */
  static parseParams(query: Record<string, unknown>): {
    page: number;
    limit: number;
    skip: number;
    sortBy?: string;
    sortOrder: 'asc' | 'desc';
  } {
    const page = Math.max(1, parseInt(String(query.page || '')) || this.DEFAULT_PAGE);
    const limit = Math.min(
      this.MAX_LIMIT,
      Math.max(1, parseInt(String(query.limit || '')) || this.DEFAULT_LIMIT),
    );
    const skip = (page - 1) * limit;
    const sortOrder = String(query.sortOrder || '') === 'desc' ? 'desc' : 'asc';
    const sortBy = query.sortBy ? String(query.sortBy) : undefined;

    return {
      page,
      limit,
      skip,
      sortBy,
      sortOrder,
    };
  }

  /**
   * Create pagination metadata
   */
  static createMeta(page: number, limit: number, total: number): PaginationMeta {
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Format paginated response
   */
  static formatResponse<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
  ): PaginatedResponse<T> {
    return {
      success: true,
      data,
      pagination: this.createMeta(page, limit, total),
    };
  }

  /**
   * Execute paginated Prisma query with count
   */
  static async executePaginatedQuery<TTransformed>(
    queryFn: () => Promise<unknown[]>,
    countFn: () => Promise<number>,
    transformFn?: (items: unknown[]) => TTransformed[],
  ): Promise<{ data: TTransformed[]; total: number }> {
    const [items, total] = await Promise.all([queryFn(), countFn()]);

    const data = transformFn ? transformFn(items) : (items as unknown as TTransformed[]);

    return { data, total };
  }

  /**
   * Get Prisma orderBy clause from sort parameters
   */
  static getPrismaOrderBy(
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'asc',
    defaultSort: Record<string, string> = { id: 'asc' },
  ): Record<string, unknown> {
    if (!sortBy) {
      return defaultSort;
    }

    // Handle nested sorting (e.g., "user.name")
    if (sortBy.includes('.')) {
      const parts = sortBy.split('.');
      const orderBy: Record<string, unknown> = {};
      let current = orderBy;

      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]] = {};
        current = current[parts[i]] as Record<string, unknown>;
      }
      current[parts[parts.length - 1]] = sortOrder;

      return orderBy;
    }

    return { [sortBy]: sortOrder };
  }

  /**
   * Validate sort field against allowed fields
   */
  static validateSortField(
    sortBy: string | undefined,
    allowedFields: string[],
  ): string | undefined {
    if (!sortBy) return undefined;

    // Handle nested fields
    const baseField = sortBy.includes('.') ? sortBy.split('.')[0] : sortBy;

    if (allowedFields.includes(sortBy) || allowedFields.includes(baseField)) {
      return sortBy;
    }

    return undefined;
  }
}
