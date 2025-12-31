import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema } from './standardSchema.js';
import { GolfCourseTeeSchema } from './golfCourse.js';
import { GolfPlayerSchema } from './golfRoster.js';

extendZodWithOpenApi(z);

const holeScoreSchema = z.number().int().min(1).max(20);

export const GolfHoleScoresSchema = z.object({
  hole1: holeScoreSchema,
  hole2: holeScoreSchema,
  hole3: holeScoreSchema,
  hole4: holeScoreSchema,
  hole5: holeScoreSchema,
  hole6: holeScoreSchema,
  hole7: holeScoreSchema,
  hole8: holeScoreSchema,
  hole9: holeScoreSchema,
  hole10: holeScoreSchema.optional(),
  hole11: holeScoreSchema.optional(),
  hole12: holeScoreSchema.optional(),
  hole13: holeScoreSchema.optional(),
  hole14: holeScoreSchema.optional(),
  hole15: holeScoreSchema.optional(),
  hole16: holeScoreSchema.optional(),
  hole17: holeScoreSchema.optional(),
  hole18: holeScoreSchema.optional(),
});

export const GolfScoreSchema = z
  .object({
    id: bigintToStringSchema,
    courseId: bigintToStringSchema,
    golferId: bigintToStringSchema,
    teeId: bigintToStringSchema,
    datePlayed: z.string(),
    holesPlayed: z.number().int().min(9).max(18),
    totalScore: z.number().int().min(18).max(200),
    totalsOnly: z.boolean().default(false),
    startIndex: z.number().nullable().optional(),
    startIndex9: z.number().nullable().optional(),
    holeScores: z.array(holeScoreSchema).min(9).max(18),
  })
  .openapi({
    title: 'GolfScore',
    description: 'A golf score with hole-by-hole scores',
  });

export const GolfScoreWithDetailsSchema = GolfScoreSchema.extend({
  player: GolfPlayerSchema.optional(),
  tee: GolfCourseTeeSchema.optional(),
  differential: z.number().optional(),
}).openapi({
  title: 'GolfScoreWithDetails',
  description: 'Golf score with player and tee details',
});

export const CreateGolfScoreSchema = z
  .object({
    courseId: bigintToStringSchema,
    teeId: bigintToStringSchema,
    datePlayed: z.string(),
    holesPlayed: z.number().int().min(9).max(18),
    totalsOnly: z.boolean().default(false),
    totalScore: z.number().int().min(18).max(200).optional(),
    holeScores: z.array(holeScoreSchema).min(9).max(18).optional(),
    startIndex: z.number().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.totalsOnly) {
        return data.totalScore !== undefined;
      }
      return data.holeScores !== undefined && data.holeScores.length >= data.holesPlayed;
    },
    {
      message: 'Either totalScore (for totalsOnly) or holeScores array is required',
    },
  )
  .openapi({
    title: 'CreateGolfScore',
    description: 'Data required to create a new golf score',
  });

export const PlayerMatchScoreSchema = z
  .object({
    teamSeasonId: bigintToStringSchema,
    rosterId: bigintToStringSchema,
    isAbsent: z.boolean().default(false),
    isSubstitute: z.boolean().default(false),
    substituteGolferId: bigintToStringSchema.optional(),
    score: CreateGolfScoreSchema.optional(),
  })
  .openapi({
    title: 'PlayerMatchScore',
    description: 'Score entry for a single player in a match',
  });

export const SubmitMatchResultsSchema = z
  .object({
    courseId: bigintToStringSchema,
    scores: z.array(PlayerMatchScoreSchema),
  })
  .openapi({
    title: 'SubmitMatchResults',
    description: 'All player scores for a match (all teams)',
  });

export type GolfHoleScoresType = z.infer<typeof GolfHoleScoresSchema>;
export type GolfScoreType = z.infer<typeof GolfScoreSchema>;
export type GolfScoreWithDetailsType = z.infer<typeof GolfScoreWithDetailsSchema>;
export type CreateGolfScoreType = z.infer<typeof CreateGolfScoreSchema>;
export type PlayerMatchScoreType = z.infer<typeof PlayerMatchScoreSchema>;
export type SubmitMatchResultsType = z.infer<typeof SubmitMatchResultsSchema>;
