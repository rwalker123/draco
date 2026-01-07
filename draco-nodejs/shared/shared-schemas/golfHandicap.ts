import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema, nameSchema } from './standardSchema.js';
import { GenderSchema } from './golfer.js';

extendZodWithOpenApi(z);

export const GolfDifferentialSchema = z
  .object({
    scoreId: bigintToStringSchema,
    datePlayed: z.string(),
    courseName: z.string(),
    score: z.number().int(),
    rating: z.number(),
    slope: z.number().int(),
    differential: z.number(),
    isUsedInCalculation: z.boolean().default(false),
  })
  .openapi({
    title: 'GolfDifferential',
    description: 'A calculated differential for a single round',
  });

export const PlayerHandicapSchema = z
  .object({
    contactId: bigintToStringSchema,
    firstName: nameSchema,
    lastName: nameSchema,
    handicapIndex: z.number().nullable(),
    handicapIndex9: z.number().nullable().optional(),
    isInitialIndex: z.boolean().optional(),
    roundsUsed: z.number().int(),
    totalRounds: z.number().int(),
    lastUpdated: z.string().optional(),
    differentials: z.array(GolfDifferentialSchema).optional(),
  })
  .openapi({
    title: 'PlayerHandicap',
    description: 'Player handicap index with calculation details',
  });

export const LeagueHandicapsSchema = z
  .object({
    flightId: bigintToStringSchema,
    flightName: nameSchema,
    players: z.array(PlayerHandicapSchema),
  })
  .openapi({
    title: 'LeagueHandicaps',
    description: 'Handicap listing for all players in a flight',
  });

export const CourseHandicapSchema = z
  .object({
    handicapIndex: z.number(),
    courseRating: z.number(),
    slopeRating: z.number().int(),
    par: z.number().int(),
    courseHandicap: z.number().int(),
  })
  .openapi({
    title: 'CourseHandicap',
    description: 'Calculated course handicap for a specific tee',
  });

export const ESCMaxScoreSchema = z
  .object({
    courseHandicap: z.number().int(),
    maxScore: z.number().int(),
  })
  .openapi({
    title: 'ESCMaxScore',
    description: 'Equitable Stroke Control maximum score per hole',
  });

export const BatchCourseHandicapRequestSchema = z
  .object({
    golferIds: z.array(bigintToStringSchema).min(1).max(50),
    teeId: bigintToStringSchema,
    holesPlayed: z.number().int().min(9).max(18).default(18),
  })
  .openapi({
    title: 'BatchCourseHandicapRequest',
    description: 'Request to calculate course handicaps for multiple golfers',
  });

export const PlayerCourseHandicapSchema = z
  .object({
    golferId: bigintToStringSchema,
    gender: GenderSchema,
    handicapIndex: z.number().nullable(),
    courseHandicap: z.number().int().nullable(),
  })
  .openapi({
    title: 'PlayerCourseHandicap',
    description: 'Course handicap for a single player',
  });

export const BatchCourseHandicapResponseSchema = z
  .object({
    teeId: bigintToStringSchema,
    courseRating: z.number(),
    slopeRating: z.number().int(),
    par: z.number().int(),
    holesPlayed: z.number().int(),
    players: z.array(PlayerCourseHandicapSchema),
  })
  .openapi({
    title: 'BatchCourseHandicapResponse',
    description: 'Course handicaps for multiple players',
  });

export type GolfDifferentialType = z.infer<typeof GolfDifferentialSchema>;
export type PlayerHandicapType = z.infer<typeof PlayerHandicapSchema>;
export type LeagueHandicapsType = z.infer<typeof LeagueHandicapsSchema>;
export type CourseHandicapType = z.infer<typeof CourseHandicapSchema>;
export type ESCMaxScoreType = z.infer<typeof ESCMaxScoreSchema>;
export type BatchCourseHandicapRequestType = z.infer<typeof BatchCourseHandicapRequestSchema>;
export type PlayerCourseHandicapType = z.infer<typeof PlayerCourseHandicapSchema>;
export type BatchCourseHandicapResponseType = z.infer<typeof BatchCourseHandicapResponseSchema>;

/**
 * WHS (World Handicap System) table for determining how many differentials to use
 * and what adjustment to apply based on the number of scores available.
 * Valid for 3-20 scores. Fewer than 3 scores = no handicap can be calculated.
 * More than 20 scores = use 8 best differentials with 0 adjustment.
 */
export const WHS_TABLE: Record<number, { use: number; adjustment: number }> = {
  3: { use: 1, adjustment: -2.0 },
  4: { use: 1, adjustment: -1.0 },
  5: { use: 1, adjustment: 0 },
  6: { use: 2, adjustment: -1.0 },
  7: { use: 2, adjustment: 0 },
  8: { use: 2, adjustment: 0 },
  9: { use: 3, adjustment: 0 },
  10: { use: 3, adjustment: 0 },
  11: { use: 3, adjustment: 0 },
  12: { use: 4, adjustment: 0 },
  13: { use: 4, adjustment: 0 },
  14: { use: 5, adjustment: 0 },
  15: { use: 5, adjustment: 0 },
  16: { use: 6, adjustment: 0 },
  17: { use: 6, adjustment: 0 },
  18: { use: 7, adjustment: 0 },
  19: { use: 7, adjustment: 0 },
  20: { use: 8, adjustment: 0 },
};

/**
 * Get the number of differentials to use for handicap calculation.
 * @param scoreCount - Total number of available scores
 * @returns Number of best differentials to use (0 if < 3 scores)
 */
export function getWhsUseCount(scoreCount: number): number {
  if (scoreCount < 3) {
    return 0;
  }
  const tableEntry = WHS_TABLE[Math.min(scoreCount, 20)];
  return tableEntry?.use ?? 8;
}

/**
 * Get the adjustment value to apply to the handicap calculation.
 * @param scoreCount - Total number of available scores
 * @returns Adjustment value (0 if < 3 scores)
 */
export function getWhsAdjustment(scoreCount: number): number {
  if (scoreCount < 3) {
    return 0;
  }
  const tableEntry = WHS_TABLE[Math.min(scoreCount, 20)];
  return tableEntry?.adjustment ?? 0;
}

/**
 * Get the indices of differentials that contribute to handicap calculation.
 * @param differentials - Array of differential values
 * @returns Set of indices for the contributing differentials
 */
export function getContributingDifferentialIndices(differentials: number[]): Set<number> {
  const count = differentials.length;
  if (count < 3) {
    return new Set<number>();
  }

  const useCount = getWhsUseCount(count);
  const indexed = differentials.map((value, index) => ({ index, value }));
  indexed.sort((a, b) => a.value - b.value);

  return new Set(indexed.slice(0, useCount).map((item) => item.index));
}
