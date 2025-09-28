import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { PaginationWithTotalSchema } from './paging.js';

extendZodWithOpenApi(z);

const UmpireNameSchema = z.string().trim().min(1);

export const UmpireSchema = z.object({
  id: z.bigint().transform((val) => val.toString()),
  accountId: z.string(),
  contactId: z.string(),
  firstName: UmpireNameSchema,
  lastName: UmpireNameSchema,
  email: z.string().email().nullish(),
  displayName: z.string(),
});

const UmpireCoreSchema = UmpireSchema.omit({ id: true, accountId: true });

export const UmpireUpsertSchema = UmpireCoreSchema.extend({
  id: UmpireSchema.shape.id.optional(),
  accountId: UmpireSchema.shape.accountId.optional(),
});

export const UmpiresSchema = z.object({
  umpires: UmpireSchema.array(),
  pagination: PaginationWithTotalSchema.optional(),
});

export type UmpireType = z.infer<typeof UmpireSchema>;
export type UmpireUpsertType = z.infer<typeof UmpireUpsertSchema>;
export type UmpiresType = z.infer<typeof UmpiresSchema>;
