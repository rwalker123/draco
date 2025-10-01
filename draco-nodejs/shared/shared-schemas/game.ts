import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { FieldSchema } from './field.js';
import { bigintToStringSchema } from './standardSchema.js';
import { TeamSeasonNameSchema } from './team.js';
import { SeasonNameSchema } from './season.js';
import { ContactIdSchema, NamedContactSchema } from './contact.js';
import { LeagueNameSchema } from './league.js';
import { PaginationSchema } from './index.js';

extendZodWithOpenApi(z);

export const GameStatusEnumSchema = z.enum([
  'Final',
  'Rainout',
  'Postponed',
  'Did Not Report',
  'Scheduled',
  'Unknown',
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
  gameStatus: z.number(),
  gameStatusText: GameStatusEnumSchema.optional(),
  gameStatusShortText: GameStatusShortEnumSchema.optional(),
  gameType: bigintToStringSchema,
  umpire1: ContactIdSchema.optional(),
  umpire2: ContactIdSchema.optional(),
  umpire3: ContactIdSchema.optional(),
  umpire4: ContactIdSchema.optional(),
});

export const GameResultSchema = z.object({
  gameId: bigintToStringSchema,
  homeScore: z.number(),
  awayScore: z.number(),
  gameStatus: z.number(),
});

export const GamesSchema = z.object({
  games: GameSchema.array(),
  pagination: PaginationSchema,
});

export const GameRecapSchema = z.object({
  team: TeamSeasonNameSchema,
  recap: z.string().max(5000),
});

export const GameRecapsSchema = GameSchema.extend({
  recaps: GameRecapSchema.array().optional(),
});

export const GamesWithRecapsSchema = z.object({
  games: GameRecapsSchema.array(),
  pagination: PaginationSchema,
});

export const UpdateGameResultsSchema = z.object({
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  gameStatus: GameStatusEnumSchema,
  emailPlayers: z.boolean().optional().default(false),
  postToTwitter: z.boolean().optional().default(false),
  postToBluesky: z.boolean().optional().default(false),
  postToFacebook: z.boolean().optional().default(false),
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
export type GamesType = z.infer<typeof GamesSchema>;
export type GameResultType = z.infer<typeof GameResultSchema>;
export type GamesWithRecapsType = z.infer<typeof GamesWithRecapsSchema>;
export type GameStatusEnumType = z.infer<typeof GameStatusEnumSchema>;
export type GameStatusShortEnumType = z.infer<typeof GameStatusShortEnumSchema>;
export type GameTypeEnumType = z.infer<typeof GameTypeEnumSchema>;
