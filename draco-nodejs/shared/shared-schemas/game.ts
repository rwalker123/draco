import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { FieldSchema } from './field.js';
import { bigintToStringSchema } from './standardSchema.js';
import { TeamSeasonNameSchema } from './team.js';
import { SeasonNameSchema } from './season.js';
import { NamedContactSchema } from './contact.js';
import { LeagueNameSchema } from './league.js';

extendZodWithOpenApi(z);

export const GameStatusEnumSchema = z.enum([
  'Scheduled',
  'Final',
  'Postponed',
  'Rainout',
  'Did Not Report',
]);
export const GameStatusShortEnumSchema = z.enum(['', 'F', 'PPD', 'R', 'DNR']);

export const GameTypeEnumSchema = z.enum(['Regular', 'Playoff', 'Exhibition']);

export const GameSchema = z.object({
  id: bigintToStringSchema,
  gameDate: z.iso.datetime(),
  homeTeam: TeamSeasonNameSchema,
  visitorTeam: TeamSeasonNameSchema,
  league: LeagueNameSchema,
  season: SeasonNameSchema,
  homeScore: z.number(),
  visitorScore: z.number(),
  comment: z.string().max(255).nullable(),
  field: FieldSchema.nullable(),
  gameStatus: GameStatusEnumSchema,
  gameStatusShortText: GameStatusShortEnumSchema,
  gameType: GameTypeEnumSchema,
  umpire1: NamedContactSchema.optional(),
  umpire2: NamedContactSchema.optional(),
  umpire3: NamedContactSchema.optional(),
  umpire4: NamedContactSchema.optional(),
});

export const GameRecapSchema = z.object({
  team: TeamSeasonNameSchema,
  recap: z.string().max(5000),
});

export const GameRecapsSchema = GameSchema.extend({
  recaps: GameRecapSchema.array().optional(),
});

export const UpdateGameResultsSchema = z.object({
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  gameStatus: GameStatusEnumSchema,
  notifications: z.boolean().optional(),
  socialPost: z.boolean().optional(),
});

export const UpsertGameSchema = {
  gameDate: z.iso.datetime(),
  homeTeamId: z.string(),
  visitorTeamId: z.string(),
  gameType: GameTypeEnumSchema,
  gameStatus: GameStatusEnumSchema.optional(),
  fieldId: z.string().nullish(),
  comment: z.string().nullish(),
  umpire1: z.string().nullish(),
  umpire2: z.string().nullish(),
  umpire3: z.string().nullish(),
  umpire4: z.string().nullish(),
};

export const UpsertGameRecapSchema = GameRecapSchema.omit({
  team: true,
});

export type GameRecapType = z.infer<typeof GameRecapSchema>;
export type GameType = z.infer<typeof GameSchema>;
export type UpdateGameResultsType = z.infer<typeof UpdateGameResultsSchema>;
export type UpsertGameType = z.infer<typeof UpsertGameSchema>;
export type UpsertGameRecapType = z.infer<typeof UpsertGameRecapSchema>;
