import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { FieldSchema } from './field.js';
import { bigintToStringSchema } from './standardSchema.js';
import { TeamSeasonNameSchema } from './team.js';
import { SeasonNameSchema } from './season.js';
import { ContactIdSchema } from './contact.js';
import { LeagueNameSchema } from './league.js';
import {
  booleanQueryParam,
  numberQueryParam,
  PaginationSchema,
  PaginationWithTotalSchema,
} from './index.js';

extendZodWithOpenApi(z);

const GAME_STATUS_SCHEDULED = 0;
const GAME_STATUS_FORFEIT = 4;
const GAME_STATUS_DID_NOT_REPORT = 5;

export const GameStatusEnumSchema = z.enum([
  'Final',
  'Rainout',
  'Postponed',
  'Did Not Report',
  'Scheduled',
  'Forfeit',
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
  season: SeasonNameSchema.optional(),
  homeScore: z.number().min(0).max(99),
  visitorScore: z.number().min(0).max(99),
  comment: z.string().max(255).optional(),
  field: FieldSchema.optional(),
  gameStatus: z
    .number()
    .describe('0=Scheduled, 1=Final, 2=Rainout, 3=Postponed, 4=Forfeit, 5=Did Not Report'),
  gameStatusText: GameStatusEnumSchema.optional(),
  gameStatusShortText: GameStatusShortEnumSchema.optional(),
  gameType: z.number().describe('0=Regular, 1=Playoff, 2=Exhibition'),
  hasGameRecap: z.boolean().optional(),
  umpire1: ContactIdSchema.optional(),
  umpire2: ContactIdSchema.optional(),
  umpire3: ContactIdSchema.optional(),
  umpire4: ContactIdSchema.optional(),
});

export const GameResultSchema = GameSchema.pick({
  id: true,
  homeScore: true,
  visitorScore: true,
  gameStatus: true,
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
  pagination: PaginationWithTotalSchema.omit({ hasNext: true, hasPrev: true }),
});

export const UpdateGameResultsSchema = GameSchema.pick({
  homeScore: true,
  visitorScore: true,
  gameStatus: true,
})
  .extend({
    emailPlayers: z.boolean(),
    postToTwitter: z.boolean(),
    postToBluesky: z.boolean(),
    postToFacebook: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const { homeScore, visitorScore, gameStatus } = data;

    if (gameStatus === GAME_STATUS_FORFEIT) {
      const isHomeScoreZero = homeScore === 0;
      const isVisitorScoreZero = visitorScore === 0;
      const homePositive = homeScore > 0;
      const visitorPositive = visitorScore > 0;

      if ((isHomeScoreZero && isVisitorScoreZero) || (homePositive && visitorPositive)) {
        ctx.addIssue({
          code: 'custom',
          message:
            'For forfeit games, one team must have a score of 0 and the other team must have a score greater than 0.',
          path: ['homeScore'],
        });
      }
    }

    if (gameStatus < GAME_STATUS_SCHEDULED || gameStatus > GAME_STATUS_DID_NOT_REPORT) {
      ctx.addIssue({
        code: 'custom',
        message: 'Invalid game status',
        path: ['gameStatus'],
      });
    }
  });

export const UpsertGameSchema = GameSchema.pick({
  gameDate: true,
  gameStatus: true,
  gameType: true,
  comment: true,
})
  .extend({
    leagueSeasonId: z.string().trim().min(1),
    homeTeam: z.object({ id: z.string().trim().min(1) }),
    visitorTeam: z.object({ id: z.string().trim().min(1) }),
    field: z.object({ id: z.string().trim().min(1) }).nullable(),
    umpire1: z
      .object({ id: z.string().trim().min(1) })
      .nullable()
      .optional(),
    umpire2: z
      .object({ id: z.string().trim().min(1) })
      .nullable()
      .optional(),
    umpire3: z
      .object({ id: z.string().trim().min(1) })
      .nullable()
      .optional(),
    umpire4: z
      .object({ id: z.string().trim().min(1) })
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.homeTeam.id === data.visitorTeam.id) {
      ctx.addIssue({
        code: 'custom',
        path: ['homeTeam'],
        message: 'Home and visitor teams must be different',
      });
    }

    if (data.gameStatus < 0 || data.gameStatus > 5) {
      ctx.addIssue({
        code: 'custom',
        path: ['gameStatus'],
        message: 'Game status must be between 0 and 5',
      });
    }

    if (data.gameType < 0 || data.gameType > 2) {
      ctx.addIssue({
        code: 'custom',
        path: ['gameType'],
        message: 'Game type must be between 0 and 2',
      });
    }
  });

export const UpsertGameRecapSchema = GameRecapSchema.omit({
  team: true,
});

export const RecentGamesSchema = z.object({
  upcoming: GameSchema.array(),
  recent: GameSchema.array(),
});

export const RecentGamesQuerySchema = z.object({
  upcoming: booleanQueryParam.optional().default(true).describe('Include upcoming games'),
  recent: booleanQueryParam.optional().default(true).describe('Include recent games'),
  limit: numberQueryParam({ min: 1, max: 20 })
    .optional()
    .default(5)
    .describe('Maximum number of games to return for each category'),
});

export type RecentGamesType = z.infer<typeof RecentGamesSchema>;
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
export type RecentGamesQueryType = z.infer<typeof RecentGamesQuerySchema>;
export type GameRecapsType = z.infer<typeof GameRecapsSchema>;
