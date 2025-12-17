import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { PaginationWithTotalSchema } from './paging.js';
import { bigintToStringSchema, nameSchema } from './standardSchema.js';

const optionalLimitedString = (max: number) => z.string().trim().max(max).nullish();

const coordinateSchema = z.preprocess(
  (value) => {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length === 0 ? null : trimmed;
    }

    return value;
  },
  z.union([
    z
      .string()
      .trim()
      .max(25)
      .refine((value) => !Number.isNaN(Number.parseFloat(value)), {
        message: 'Coordinate must be a valid number',
      }),
    z.null(),
  ]),
);

extendZodWithOpenApi(z);

export const FieldNameSchema = z.object({
  id: bigintToStringSchema,
  name: nameSchema,
  shortName: z.string().trim().max(5),
});

export const FieldSchema = FieldNameSchema.extend({
  hasLights: z.boolean().optional().default(false),
  address: optionalLimitedString(255),
  city: optionalLimitedString(25),
  state: optionalLimitedString(25),
  zip: optionalLimitedString(10),
  comment: optionalLimitedString(255),
  directions: optionalLimitedString(255),
  rainoutNumber: optionalLimitedString(15),
  latitude: coordinateSchema,
  longitude: coordinateSchema,
});

export const UpsertFieldSchema = FieldSchema.omit({ id: true });

export const FieldsSchema = z.object({
  fields: FieldSchema.array(),
  pagination: PaginationWithTotalSchema.optional(),
});

export type FieldType = z.infer<typeof FieldSchema>;
export type FieldsType = z.infer<typeof FieldsSchema>;
export type UpsertFieldType = z.infer<typeof UpsertFieldSchema>;
