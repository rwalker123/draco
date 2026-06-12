import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { DivisionNameSchema, DivisionSeasonSchema } from './division.js';
import { LeagueNameSchema } from './league.js';
import { TeamSeasonNameSchema, TeamSeasonSchema } from './team.js';
import { bigintToStringSchema } from './standardSchema.js';
import { isoDateTimeSchema } from './date.js';

extendZodWithOpenApi(z);

export const TeamRecordSchema = z.object({
  w: z.number(),
  l: z.number(),
  t: z.number(),
});

export const StandingsNextGameSchema = z.object({
  id: bigintToStringSchema,
  gameDate: isoDateTimeSchema,
  opponent: TeamSeasonNameSchema,
  isHome: z.boolean(),
});

export const StandingsTeamSchema = TeamRecordSchema.extend({
  team: TeamSeasonNameSchema,
  league: LeagueNameSchema.optional(),
  division: DivisionNameSchema.optional(),
  pct: z.number(),
  gb: z.number(),
  divisionRecord: TeamRecordSchema.optional(),
  rs: z.number(),
  ra: z.number(),
  nextGame: StandingsNextGameSchema.optional(),
});

export const StandingsDivisionSchema = z.object({
  division: DivisionSeasonSchema.omit({ season: true }),
  teams: z.array(StandingsTeamSchema),
});

export const StandingsLeagueSchema = z.object({
  league: LeagueNameSchema,
  divisions: z.array(StandingsDivisionSchema),
});

export const TeamSeasonRecordSchema = TeamSeasonSchema.extend({
  record: TeamRecordSchema,
});

export type TeamRecordType = z.infer<typeof TeamRecordSchema>;
export type StandingsNextGameType = z.infer<typeof StandingsNextGameSchema>;
export type StandingsTeamType = z.infer<typeof StandingsTeamSchema>;
export type StandingsDivisionType = z.infer<typeof StandingsDivisionSchema>;
export type StandingsLeagueType = z.infer<typeof StandingsLeagueSchema>;
export type TeamSeasonRecordType = z.infer<typeof TeamSeasonRecordSchema>;
