import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { DivisionNameSchema, DivisionSeasonSchema } from './division.js';
import { LeagueNameSchema } from './league.js';
import { TeamSeasonNameSchema, TeamSeasonSchema } from './team.js';

extendZodWithOpenApi(z);

export const TeamRecordSchema = z.object({
  w: z.number(),
  l: z.number(),
  t: z.number(),
});

export const StandingsTeamSchema = TeamRecordSchema.extend({
  team: TeamSeasonNameSchema,
  league: LeagueNameSchema.optional(),
  division: DivisionNameSchema.optional(),
  pct: z.number(),
  gb: z.number(),
  divisionRecord: TeamRecordSchema.optional(),
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
export type StandingsTeamType = z.infer<typeof StandingsTeamSchema>;
export type StandingsDivisionType = z.infer<typeof StandingsDivisionSchema>;
export type StandingsLeagueType = z.infer<typeof StandingsLeagueSchema>;
export type TeamSeasonRecordType = z.infer<typeof TeamSeasonRecordSchema>;
