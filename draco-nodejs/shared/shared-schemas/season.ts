import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema, nameSchema } from './standardSchema.js';

extendZodWithOpenApi(z);

export const SeasonNameSchema = z.object({
  id: bigintToStringSchema,
  name: nameSchema,
});

export const SeasonSchema = SeasonNameSchema.extend({
  accountId: bigintToStringSchema,
  isCurrent: z.boolean().optional(),
});

export const UpsertSeasonSchema = SeasonNameSchema.omit({
  id: true,
}).openapi({
  description: 'Schema for creating a season',
});

export const CopySeasonDataSchema = z.object({
  season: SeasonSchema,
  copiedLeagues: z.number().int().nonnegative(),
});

export const SetCurrentSeasonDataSchema = z.object({
  seasonId: z.bigint().transform((val) => val.toString()),
  accountId: z.bigint().transform((val) => val.toString()),
});

export const SeasonParticipantCountDataSchema = z.object({
  seasonId: z.bigint().transform((val) => val.toString()),
  participantCount: z.number().int().nonnegative(),
});

export type SeasonType = z.infer<typeof SeasonSchema>;
export type CopySeasonDataType = z.infer<typeof CopySeasonDataSchema>;
export type SetCurrentSeasonDataType = z.infer<typeof SetCurrentSeasonDataSchema>;
export type SeasonParticipantCountDataType = z.infer<typeof SeasonParticipantCountDataSchema>;
export type UpsertSeasonType = z.infer<typeof UpsertSeasonSchema>;
