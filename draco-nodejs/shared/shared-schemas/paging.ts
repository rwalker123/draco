import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

// these are using coerce as they are coming on the query string as strings
export const PagingSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  skip: z.coerce.number().min(0).default(0),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type PagingType = z.infer<typeof PagingSchema>;

export const PaginationSchema = z
  .object({
    page: z.number(),
    limit: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  })
  .openapi({
    title: 'Pagination',
    description: 'Pagination metadata included with paged API responses',
  });

export type PaginationType = z.infer<typeof PaginationSchema>;

export const PaginationWithTotalSchema = PaginationSchema.extend({
  total: z.number(),
}).openapi({
  title: 'PaginationWithTotal',
  description: 'Pagination metadata that includes the total number of items',
});

export type PaginationWithTotalType = z.infer<typeof PaginationWithTotalSchema>;
