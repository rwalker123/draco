import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema, nameSchema } from './standardSchema.js';
import { GolfCourseSchema } from './golfCourse.js';
import { GolfScoreWithDetailsSchema } from './golfScore.js';

extendZodWithOpenApi(z);

export const GolfMatchStatusSchema = z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']);

export const GolfMatchTypeSchema = z.enum(['regular', 'playoff', 'practice']);

export const GolfMatchTeamSchema = z.object({
  id: bigintToStringSchema,
  name: nameSchema,
});

export const GolfMatchSchema = z
  .object({
    id: bigintToStringSchema,
    team1: GolfMatchTeamSchema,
    team2: GolfMatchTeamSchema,
    leagueSeasonId: bigintToStringSchema,
    matchDate: z.string(),
    matchTime: z.string(),
    course: GolfCourseSchema.optional(),
    matchStatus: z.number().int(),
    matchType: z.number().int(),
    comment: z.string().max(255).optional(),
  })
  .openapi({
    title: 'GolfMatch',
    description: 'A golf match between two teams',
  });

export const GolfMatchWithScoresSchema = GolfMatchSchema.extend({
  team1Scores: z.array(GolfScoreWithDetailsSchema).optional(),
  team2Scores: z.array(GolfScoreWithDetailsSchema).optional(),
  team1TotalScore: z.number().int().optional(),
  team2TotalScore: z.number().int().optional(),
  team1Points: z.number().optional(),
  team2Points: z.number().optional(),
}).openapi({
  title: 'GolfMatchWithScores',
  description: 'Golf match with team scores and points',
});

export const GolfMatchResultSchema = z
  .object({
    matchId: bigintToStringSchema,
    team1TotalScore: z.number().int(),
    team2TotalScore: z.number().int(),
    team1Points: z.number(),
    team2Points: z.number(),
    team1NetScore: z.number().int().optional(),
    team2NetScore: z.number().int().optional(),
  })
  .openapi({
    title: 'GolfMatchResult',
    description: 'Summary result of a completed golf match',
  });

export const CreateGolfMatchSchema = z
  .object({
    team1Id: bigintToStringSchema,
    team2Id: bigintToStringSchema,
    matchDate: z.string(),
    matchTime: z.string(),
    courseId: bigintToStringSchema.optional(),
    matchType: z.number().int().default(0),
    comment: z.string().max(255).optional(),
  })
  .openapi({
    title: 'CreateGolfMatch',
    description: 'Data required to create a new golf match',
  });

export const UpdateGolfMatchSchema = CreateGolfMatchSchema.partial()
  .extend({
    matchStatus: z.number().int().optional(),
  })
  .openapi({
    title: 'UpdateGolfMatch',
    description: 'Data for updating an existing golf match',
  });

export const GolfMatchDayResultsSchema = z
  .object({
    date: z.string(),
    matches: z.array(GolfMatchWithScoresSchema),
  })
  .openapi({
    title: 'GolfMatchDayResults',
    description: 'All match results for a specific day',
  });

export type GolfMatchStatusType = z.infer<typeof GolfMatchStatusSchema>;
export type GolfMatchTypeType = z.infer<typeof GolfMatchTypeSchema>;
export type GolfMatchTeamType = z.infer<typeof GolfMatchTeamSchema>;
export type GolfMatchType = z.infer<typeof GolfMatchSchema>;
export type GolfMatchWithScoresType = z.infer<typeof GolfMatchWithScoresSchema>;
export type GolfMatchResultType = z.infer<typeof GolfMatchResultSchema>;
export type CreateGolfMatchType = z.infer<typeof CreateGolfMatchSchema>;
export type UpdateGolfMatchType = z.infer<typeof UpdateGolfMatchSchema>;
export type GolfMatchDayResultsType = z.infer<typeof GolfMatchDayResultsSchema>;
