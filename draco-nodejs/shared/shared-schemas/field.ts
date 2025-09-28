import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { PaginationWithTotalSchema } from './paging.js';

extendZodWithOpenApi(z);

const FieldNameSchema = z.string().trim().min(1);
const FieldAddressSchema = z.string().trim().nullish();

export const FieldSchema = z.object({
  id: z.bigint().transform((val) => val.toString()),
  accountId: z.string().optional(),
  name: FieldNameSchema,
  address: FieldAddressSchema,
});

const FieldCoreSchema = FieldSchema.omit({ id: true, accountId: true });

export const FieldUpsertSchema = FieldCoreSchema.extend({
  id: FieldSchema.shape.id.optional(),
  accountId: FieldSchema.shape.accountId.optional(),
  address: FieldAddressSchema.optional(),
});

export const CreateFieldSchema = FieldUpsertSchema.omit({ id: true });

export const FieldsSchema = z.object({
  fields: FieldSchema.array(),
  pagination: PaginationWithTotalSchema.optional(),
});

export type FieldType = z.infer<typeof FieldSchema>;
export type FieldUpsertType = z.infer<typeof FieldUpsertSchema>;
export type CreateFieldType = z.infer<typeof CreateFieldSchema>;
export type FieldsType = z.infer<typeof FieldsSchema>;
