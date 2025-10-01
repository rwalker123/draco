import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { FieldSchema } from './field.js';
import { bigintToStringSchema } from './standardSchema.js';
import { TeamSeasonNameSchema } from './team.js';
import { SeasonNameSchema } from './season.js';
import { ContactIdSchema } from './contact.js';
import { LeagueNameSchema } from './league.js';
import { PaginationSchema } from './index.js';

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
  season: SeasonNameSchema,
  homeScore: z.number().min(0).max(99),
  visitorScore: z.number().min(0).max(99),
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
  pagination: PaginationSchema,
});

export const UpdateGameResultsSchema = GameSchema.pick({
  homeScore: true,
  visitorScore: true,
  gameStatus: true,
})
  .extend({
    emailPlayers: true,
    postToTwitter: true,
    postToBluesky: true,
    postToFacebook: true,
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
  homeTeam: true,
  visitorTeam: true,
  gameType: true,
  gameStatus: true,
  field: true,
  comment: true,
  umpire1: true,
  umpire2: true,
  umpire3: true,
  umpire4: true,
})
  .extend({
    leagueSeasonId: z.string().trim().min(1),
  })
  .refine((data) => data.homeTeam.id === data.visitorTeam.id, {
    message: 'Home and visitor teams must be different',
    path: ['homeTeam'],
  });

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
