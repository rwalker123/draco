import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { SeasonNameSchema, SeasonSchema } from './season.js';
import { bigintToStringSchema, nameSchema } from './standardSchema.js';
import { booleanQueryParam } from './queryParams.js';
import { DivisionSeasonSchema } from './division.js';

extendZodWithOpenApi(z);

export const LeagueNameSchema = z.object({
  id: bigintToStringSchema,
  name: nameSchema,
});

export const LeagueSchema = LeagueNameSchema.extend({
  accountId: bigintToStringSchema,
});

export const UpsertLeagueSchema = LeagueNameSchema.omit({
  id: true,
});

export const LeagueSeasonSchema = z.object({
  id: bigintToStringSchema,
  league: LeagueNameSchema,
  season: SeasonNameSchema.optional(),
});

export const LeagueSeasonWithDivisionSchema = SeasonSchema.extend({
  leagues: LeagueSeasonSchema.omit({
    season: true,
  })
    .extend({
      divisions: DivisionSeasonSchema.omit({
        season: true,
      })
        .array()
        .optional(),
    })
    .array(),
});

export const UpsertLeagueSeasonDivisionSchema = z.object({
  name: nameSchema,
  priority: z.coerce.number().int().optional(),
});

export const LeaguesInSeasonSchema = z.object({
  season: SeasonSchema.nullable(),
  leagueSeasons: LeagueSeasonSchema.array(),
});

export const LeagueSeasonQueryParamsSchema = z.object({
  includeTeams: booleanQueryParam.optional(),
  includeUnassignedTeams: booleanQueryParam.optional().default(false),
  includePlayerCounts: booleanQueryParam.optional().default(false),
  includeManagerCounts: booleanQueryParam.optional().default(false),
});

export type LeagueType = z.infer<typeof LeagueSchema>;
export type LeagueNameType = z.infer<typeof LeagueNameSchema>;
export type UpsertLeagueType = z.infer<typeof UpsertLeagueSchema>;
export type LeagueSeasonType = z.infer<typeof LeagueSeasonSchema>;
export type LeaguesInSeasonType = z.infer<typeof LeaguesInSeasonSchema>;
export type UpsertLeagueSeasonDivisionType = z.infer<typeof UpsertLeagueSeasonDivisionSchema>;
export type LeagueSeasonQueryParamsType = z.infer<typeof LeagueSeasonQueryParamsSchema>;
export type LeagueSeasonWithDivisionType = z.infer<typeof LeagueSeasonWithDivisionSchema>;
