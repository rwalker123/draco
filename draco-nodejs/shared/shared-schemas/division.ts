import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema, nameSchema } from './standardSchema.js';
import { SeasonNameSchema } from './seasonBase.js';

extendZodWithOpenApi(z);

export const DivisionNameSchema = z.object({
  id: bigintToStringSchema,
  name: nameSchema,
});

export const DivisionSchema = DivisionNameSchema.extend({
  accountId: bigintToStringSchema,
});

export const DivisionSeasonSchema = z.object({
  id: bigintToStringSchema,
  division: DivisionNameSchema,
  season: SeasonNameSchema.optional(),
  priority: z.number().int(),
});

export const UpsertDivisionSeasonSchema = z.object({
  divisionId: bigintToStringSchema.optional(),
  name: nameSchema.optional(),
  priority: z.coerce.number().int().optional(),
  switchToExistingDivision: z.boolean().optional(),
});

export const UpdateDivisionSeasonResponseSchema = z.object({
  success: z.boolean(),
  conflict: z
    .object({
      existingDivisionId: bigintToStringSchema,
      existingDivisionName: z.string(),
    })
    .optional(),
});

export type DivisionNameType = z.infer<typeof DivisionNameSchema>;
export type DivisionType = z.infer<typeof DivisionSchema>;
export type DivisionSeasonType = z.infer<typeof DivisionSeasonSchema>;
export type UpsertDivisionSeasonType = z.infer<typeof UpsertDivisionSeasonSchema>;
export type UpdateDivisionSeasonResponseType = z.infer<typeof UpdateDivisionSeasonResponseSchema>;
