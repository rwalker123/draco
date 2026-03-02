import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { PaginationWithTotalSchema } from './paging.js';
import { bigintToStringSchema } from './standardSchema.js';
import { BaseContactSchema } from './contact.js';

extendZodWithOpenApi(z);

export const UmpireSchema = BaseContactSchema.omit({ id: true, userId: true }).extend({
  id: bigintToStringSchema,
  contactId: z.string(),
  accountId: z.string(),
});

export const CreateUmpireSchema = z.object({
  contactId: bigintToStringSchema,
});

export const UmpiresSchema = z.object({
  umpires: UmpireSchema.array(),
  pagination: PaginationWithTotalSchema.optional(),
});

export type UmpireType = z.infer<typeof UmpireSchema>;
export type CreateUmpireType = z.infer<typeof CreateUmpireSchema>;
export type UmpiresType = z.infer<typeof UmpiresSchema>;
