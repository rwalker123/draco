import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { booleanQueryParam } from './queryParams.js';

extendZodWithOpenApi(z);

export const AdminUserSummarySchema = z
  .object({
    id: z.string(),
    username: z.string(),
    contactCount: z.number().int().nonnegative(),
    accessFailedCount: z.number().int().nonnegative(),
    lockoutEndDateUtc: z.string().nullable(),
    hasPassword: z.boolean(),
  })
  .openapi({
    title: 'AdminUserSummary',
    description: 'Summary of an aspnetusers row, used by the global Administrator user list.',
  });

export const AdminUserListQuerySchema = z
  .object({
    search: z.string().trim().max(200).optional(),
    orphansOnly: booleanQueryParam.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .openapi({
    title: 'AdminUserListQuery',
    description: 'Filters and pagination parameters for the admin user list.',
  });

export const AdminUserListResponseSchema = z
  .object({
    users: AdminUserSummarySchema.array(),
    total: z.number().int().nonnegative(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  })
  .openapi({
    title: 'AdminUserListResponse',
    description: 'Paged response of admin user summaries.',
  });

export type AdminUserSummaryType = z.infer<typeof AdminUserSummarySchema>;
export type AdminUserListQueryType = z.infer<typeof AdminUserListQuerySchema>;
export type AdminUserListResponseType = z.infer<typeof AdminUserListResponseSchema>;
