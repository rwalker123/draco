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

export const CopySeasonResponseDataSchema = z.object({
  season: SeasonSchema,
  copiedLeagues: z.number().int().nonnegative(),
});

export const SetCurrentSeasonResponseDataSchema = z.object({
  seasonId: z.bigint().transform((val) => val.toString()),
  accountId: z.bigint().transform((val) => val.toString()),
});

export const DeleteSeasonResponseDataSchema = z.object({
  message: z.string().trim().min(1),
});

export const SeasonParticipantCountResponseDataSchema = z.object({
  seasonId: z.bigint().transform((val) => val.toString()),
  participantCount: z.number().int().nonnegative(),
});

export type SeasonType = z.infer<typeof SeasonSchema>;
export type CopySeasonResponseData = z.infer<typeof CopySeasonResponseDataSchema>;
export type SetCurrentSeasonResponseData = z.infer<typeof SetCurrentSeasonResponseDataSchema>;
export type DeleteSeasonResponseData = z.infer<typeof DeleteSeasonResponseDataSchema>;
export type SeasonParticipantCountResponseData = z.infer<
  typeof SeasonParticipantCountResponseDataSchema
>;
export type UpsertSeasonType = z.infer<typeof UpsertSeasonSchema>;
