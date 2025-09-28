import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { SeasonSchema } from './season.js';

extendZodWithOpenApi(z);

export const LeagueSchema = z.object({
  id: z.bigint().transform((val) => val.toString()),
  name: z.string(),
});

export const DivisionSchema = z.object({
  id: z.bigint().transform((val) => val.toString()),
  name: z.string(),
});

export const TeamSeasonRecordSchema = z.object({
  wins: z.number().min(0),
  losses: z.number().min(0),
  ties: z.number().min(0),
});

export const TeamSeasonNameSchema = z.object({
  id: z.bigint().transform((val) => val.toString()),
  name: z.string().trim().min(1).max(100),
});

export const TeamSeasonSummarySchema = TeamSeasonNameSchema.extend({
  teamId: z.string(),
  league: LeagueSchema,
  division: DivisionSchema.nullable().optional(),
  webAddress: z.string().nullable().optional(),
  youtubeUserId: z.string().nullable().optional(),
  defaultVideo: z.string().nullable().optional(),
  autoPlayVideo: z.boolean().default(false).optional(),
  logoUrl: z.url().optional().nullable(),
});

export const TeamSeasonDetailsSchema = TeamSeasonSummarySchema.extend({
  logoUrl: z.string(),
  leagueName: z.string(),
  season: SeasonSchema.nullable(),
  record: TeamSeasonRecordSchema,
});

export type LeagueType = z.infer<typeof LeagueSchema>;
export type DivisionType = z.infer<typeof DivisionSchema>;
export type TeamSeasonNameType = z.infer<typeof TeamSeasonNameSchema>;
export type TeamSeasonRecordType = z.infer<typeof TeamSeasonRecordSchema>;
export type TeamSeasonSummaryType = z.infer<typeof TeamSeasonSummarySchema>;
export type TeamSeasonDetailsType = z.infer<typeof TeamSeasonDetailsSchema>;
