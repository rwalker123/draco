import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { PaginationWithTotalSchema } from './paging.js';
import { bigintToStringSchema, nameSchema } from './standardSchema.js';

extendZodWithOpenApi(z);

export const FieldNameSchema = z.object({
  id: bigintToStringSchema,
  name: nameSchema,
  shortName: z.string().trim().max(5),
});

export const FieldSchema = FieldNameSchema.extend({
  address: z.string().trim().nullish(),
  city: z.string().trim().nullish(),
  state: z.string().trim().nullish(),
  zip: z.string().trim().nullish(),
});

export const UpsertFieldSchema = FieldSchema.omit({ id: true });

export const FieldsSchema = z.object({
  fields: FieldSchema.array(),
  pagination: PaginationWithTotalSchema.optional(),
});

export type FieldType = z.infer<typeof FieldSchema>;
export type FieldsType = z.infer<typeof FieldsSchema>;
export type UpsertFieldType = z.infer<typeof UpsertFieldSchema>;
