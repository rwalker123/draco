import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { SeasonSchema } from './season.js';
import { bigintToStringSchema, nameSchema } from './standardSchema.js';
import { LeagueNameSchema, LeagueSeasonSchema } from './league.js';
import { DivisionNameSchema, DivisionSeasonSchema } from './division.js';

extendZodWithOpenApi(z);

export const TeamSchema = z.object({
  id: bigintToStringSchema,
  webAddress: z.string().nullable().optional(),
  youtubeUserId: z.string().nullable().optional(),
  defaultVideo: z.string().nullable().optional(),
  autoPlayVideo: z.boolean().optional(),
  logoUrl: z.url().optional().nullable(),
});

export const TeamSeasonNameSchema = z.object({
  id: bigintToStringSchema,
  name: nameSchema.optional(),
});

export const TeamSeasonSchema = TeamSeasonNameSchema.extend({
  team: TeamSchema,
  season: SeasonSchema.optional(),
  league: LeagueNameSchema.optional(),
  division: DivisionNameSchema.optional(),
});

export const TeamSeasonWithPlayerCountSchema = TeamSeasonSchema.extend({
  playerCount: z.number().int().nonnegative().optional(),
  managerCount: z.number().int().nonnegative().optional(),
});

export const UpsertTeamSeasonSchema = TeamSeasonSchema.omit({
  id: true,
  league: true,
  division: true,
  team: true,
}).extend({
  team: TeamSchema.omit({ id: true, logoUrl: true }).partial().optional(),
  divisionId: z.string().nullable().optional(),
  leagueId: z.string().nullable().optional(),
});

export const DivisionSeasonWithTeamsSchema = DivisionSeasonSchema.extend({
  teams: TeamSeasonWithPlayerCountSchema.array(),
});

export const LeagueSeasonWithDivisionTeamsSchema = LeagueSeasonSchema.extend({
  divisions: DivisionSeasonWithTeamsSchema.array().optional(),
});

export const LeagueSeasonWithDivisionTeamsAndUnassignedSchema =
  LeagueSeasonWithDivisionTeamsSchema.extend({
    unassignedTeams: TeamSeasonWithPlayerCountSchema.array().optional(),
  });

export const LeagueSetupSchema = z.object({
  season: SeasonSchema.optional(),
  leagueSeasons: LeagueSeasonWithDivisionTeamsAndUnassignedSchema.array(),
});

export type TeamSeasonNameType = z.infer<typeof TeamSeasonNameSchema>;
export type UpsertTeamSeasonType = z.infer<typeof UpsertTeamSeasonSchema>;
export type TeamSeasonType = z.infer<typeof TeamSeasonSchema>;
export type TeamType = z.infer<typeof TeamSchema>;
export type DivisionSeasonWithTeamsType = z.infer<typeof DivisionSeasonWithTeamsSchema>;
export type LeagueSeasonWithDivisionTeamsType = z.infer<typeof LeagueSeasonWithDivisionTeamsSchema>;
export type LeagueSeasonWithDivisionTeamsAndUnassignedType = z.infer<
  typeof LeagueSeasonWithDivisionTeamsAndUnassignedSchema
>;
export type LeagueSetupType = z.infer<typeof LeagueSetupSchema>;
export type TeamSeasonWithPlayerCountType = z.infer<typeof TeamSeasonWithPlayerCountSchema>;
