import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema, nameSchema } from './standardSchema.js';

extendZodWithOpenApi(z);

export const GolfStatDefSchema = z
  .object({
    id: bigintToStringSchema,
    name: nameSchema,
    shortName: z.string().trim().max(5),
    dataType: z.number().int(),
    isCalculated: z.boolean(),
    isPerHoleValue: z.boolean(),
    formulaCode: z.string().max(255).optional(),
    validationCode: z.string().max(255).optional(),
    listValues: z.string().max(255).optional(),
  })
  .openapi({
    title: 'GolfStatDef',
    description: 'Definition of a golf statistic',
  });

export const GolfLeaderSchema = z
  .object({
    contactId: bigintToStringSchema,
    firstName: nameSchema,
    lastName: nameSchema,
    teamName: nameSchema.optional(),
    value: z.number(),
    rank: z.number().int(),
  })
  .openapi({
    title: 'GolfLeader',
    description: 'A leader entry in a golf statistic category',
  });

export const GolfLeaderboardSchema = z
  .object({
    category: z.string(),
    categoryLabel: z.string(),
    leaders: z.array(GolfLeaderSchema),
  })
  .openapi({
    title: 'GolfLeaderboard',
    description: 'Leaderboard for a specific statistical category',
  });

export const GolfSkinsEntrySchema = z
  .object({
    contactId: bigintToStringSchema,
    firstName: nameSchema,
    lastName: nameSchema,
    teamName: nameSchema.optional(),
    skinsWon: z.number().int(),
    skinsValue: z.number().optional(),
    skinsType: z.enum(['actual', 'net']).optional(),
    weekNumber: z.number().int().nullable().optional(),
  })
  .openapi({
    title: 'GolfSkinsEntry',
    description: 'Skins game entry for a player',
  });

export const GolfSkinsLeaderboardSchema = z
  .object({
    flightId: bigintToStringSchema,
    flightName: nameSchema,
    entries: z.array(GolfSkinsEntrySchema),
  })
  .openapi({
    title: 'GolfSkinsLeaderboard',
    description: 'Skins leaderboard for a flight',
  });

export const GolfScoringAverageSchema = z
  .object({
    contactId: bigintToStringSchema,
    firstName: nameSchema,
    lastName: nameSchema,
    teamName: nameSchema.optional(),
    roundsPlayed: z.number().int(),
    averageScore: z.number(),
    averageNetScore: z.number().optional(),
  })
  .openapi({
    title: 'GolfScoringAverage',
    description: 'Scoring average for a player',
  });

export const GolfScoreTypeCountsSchema = z
  .object({
    aces: z.number().int(),
    eagles: z.number().int(),
    birdies: z.number().int(),
    pars: z.number().int(),
    bogeys: z.number().int(),
    doubleBogeys: z.number().int(),
    triplesOrWorse: z.number().int(),
  })
  .openapi({
    title: 'GolfScoreTypeCounts',
    description: 'Count of each score type relative to par',
  });

export const GolfHoleTypeStatsSchema = z
  .object({
    par3Average: z.number().optional(),
    par4Average: z.number().optional(),
    par5Average: z.number().optional(),
    par3Rounds: z.number().int().optional(),
    par4Rounds: z.number().int().optional(),
    par5Rounds: z.number().int().optional(),
  })
  .openapi({
    title: 'GolfHoleTypeStats',
    description: 'Average scoring by hole par type',
  });

export const GolfPuttStatsSchema = z
  .object({
    totalPutts: z.number().int(),
    averagePerRound: z.number(),
    bestRound: z.number().int(),
    worstRound: z.number().int(),
  })
  .openapi({
    title: 'GolfPuttStats',
    description: 'Putt statistics across rounds',
  });

export const GolfFairwayStatsSchema = z
  .object({
    averagePercentage: z.number(),
    bestPercentage: z.number(),
    worstPercentage: z.number(),
  })
  .openapi({
    title: 'GolfFairwayStats',
    description: 'Fairway hit statistics across rounds',
  });

export const GolfGirStatsSchema = z
  .object({
    averagePercentage: z.number(),
    bestPercentage: z.number(),
    worstPercentage: z.number(),
  })
  .openapi({
    title: 'GolfGirStats',
    description: 'Greens in regulation statistics across rounds',
  });

export const GolfPlayerDetailedStatsSchema = z
  .object({
    contactId: bigintToStringSchema,
    firstName: nameSchema,
    lastName: nameSchema,
    teamName: nameSchema.optional(),
    roundsPlayed: z.number().int(),
    lowActualScore: z.number().int(),
    highActualScore: z.number().int(),
    lowNetScore: z.number().int().optional(),
    highNetScore: z.number().int().optional(),
    averageScore: z.number(),
    averageNetScore: z.number().optional(),
    scoreTypeCounts: GolfScoreTypeCountsSchema,
    maxBirdiesInRound: z.number().int(),
    maxParsInRound: z.number().int(),
    maxBogeyPlusInRound: z.number().int(),
    puttStats: GolfPuttStatsSchema.optional(),
    fairwayStats: GolfFairwayStatsSchema.optional(),
    girStats: GolfGirStatsSchema.optional(),
    scramblingPercentage: z.number().optional(),
    consistencyStdDev: z.number().optional(),
    holeTypeStats: GolfHoleTypeStatsSchema.optional(),
  })
  .openapi({
    title: 'GolfPlayerDetailedStats',
    description: 'Comprehensive individual golfer statistics',
  });

export const GolfClosestToPinEntrySchema = z
  .object({
    id: bigintToStringSchema,
    matchId: bigintToStringSchema,
    holeNumber: z.number().int(),
    contactId: bigintToStringSchema,
    firstName: nameSchema,
    lastName: nameSchema,
    distance: z.number(),
    unit: z.string(),
    matchDate: z.string(),
    weekNumber: z.number().int().nullable().optional(),
  })
  .openapi({
    title: 'GolfClosestToPinEntry',
    description: 'Closest to pin entry for a par 3 hole',
  });

export const CreateGolfClosestToPinSchema = z
  .object({
    holeNumber: z.number().int().min(1).max(18),
    contactId: bigintToStringSchema,
    distance: z.number().min(0),
    unit: z.string().max(5).default('ft'),
  })
  .openapi({
    title: 'CreateGolfClosestToPin',
    description: 'Data to create a closest to pin entry',
  });

export const UpdateGolfClosestToPinSchema = z
  .object({
    contactId: bigintToStringSchema.optional(),
    distance: z.number().min(0).optional(),
    unit: z.string().max(5).optional(),
  })
  .openapi({
    title: 'UpdateGolfClosestToPin',
    description: 'Data to update a closest to pin entry',
  });

export const GolfPuttContestEntrySchema = z
  .object({
    contactId: bigintToStringSchema,
    firstName: nameSchema,
    lastName: nameSchema,
    holeNumber: z.number().int(),
    putts: z.number().int(),
    matchId: bigintToStringSchema,
    matchDate: z.string(),
    weekNumber: z.number().int().nullable().optional(),
  })
  .openapi({
    title: 'GolfPuttContestEntry',
    description: 'A 3+ putt contest entry',
  });

export const GolfFlightLeadersSchema = z
  .object({
    flightId: bigintToStringSchema,
    flightName: nameSchema,
    lowActualScore: z.array(GolfLeaderSchema),
    lowNetScore: z.array(GolfLeaderSchema),
    scoringAverages: z.array(GolfScoringAverageSchema),
    skins: z.array(GolfSkinsEntrySchema).optional(),
    netSkins: z.array(GolfSkinsEntrySchema).optional(),
    scoreTypeLeaders: z.array(GolfLeaderboardSchema).optional(),
    closestToPin: z.array(GolfClosestToPinEntrySchema).optional(),
    puttContestEntries: z.array(GolfPuttContestEntrySchema).optional(),
  })
  .openapi({
    title: 'GolfFlightLeaders',
    description: 'All leader categories for a flight',
  });

export const WeekBoundaryEnum = z.enum([
  'sun-sat',
  'mon-sun',
  'tue-mon',
  'wed-tue',
  'thu-wed',
  'fri-thu',
  'sat-fri',
]);

export const RegenerateStatsRequestSchema = z
  .object({
    leagueSeasonId: bigintToStringSchema,
    regenerateGir: z.boolean().default(false),
    regenerateWeekNumbers: z.boolean().default(false),
    weekBoundary: WeekBoundaryEnum.default('mon-sun'),
    timeZone: z.string().default('America/New_York'),
    recalculateMatchPoints: z.boolean().default(false),
  })
  .openapi({
    title: 'RegenerateStatsRequest',
    description: 'Options for regenerating golf statistics',
  });

export const RegenerateStatsResultSchema = z
  .object({
    girScoresUpdated: z.number().int(),
    weekNumbersAssigned: z.number().int(),
    matchPointsRecalculated: z.number().int(),
  })
  .openapi({
    title: 'RegenerateStatsResult',
    description: 'Results of a stats regeneration operation',
  });

export type GolfStatDefType = z.infer<typeof GolfStatDefSchema>;
export type GolfLeaderType = z.infer<typeof GolfLeaderSchema>;
export type GolfLeaderboardType = z.infer<typeof GolfLeaderboardSchema>;
export type GolfSkinsEntryType = z.infer<typeof GolfSkinsEntrySchema>;
export type GolfSkinsLeaderboardType = z.infer<typeof GolfSkinsLeaderboardSchema>;
export type GolfScoringAverageType = z.infer<typeof GolfScoringAverageSchema>;
export type GolfScoreTypeCountsType = z.infer<typeof GolfScoreTypeCountsSchema>;
export type GolfHoleTypeStatsType = z.infer<typeof GolfHoleTypeStatsSchema>;
export type GolfPuttStatsType = z.infer<typeof GolfPuttStatsSchema>;
export type GolfFairwayStatsType = z.infer<typeof GolfFairwayStatsSchema>;
export type GolfGirStatsType = z.infer<typeof GolfGirStatsSchema>;
export type GolfPlayerDetailedStatsType = z.infer<typeof GolfPlayerDetailedStatsSchema>;
export type GolfClosestToPinEntryType = z.infer<typeof GolfClosestToPinEntrySchema>;
export type CreateGolfClosestToPinType = z.infer<typeof CreateGolfClosestToPinSchema>;
export type UpdateGolfClosestToPinType = z.infer<typeof UpdateGolfClosestToPinSchema>;
export type GolfPuttContestEntryType = z.infer<typeof GolfPuttContestEntrySchema>;
export type GolfFlightLeadersType = z.infer<typeof GolfFlightLeadersSchema>;
export type WeekBoundaryType = z.infer<typeof WeekBoundaryEnum>;
export type RegenerateStatsRequestType = z.infer<typeof RegenerateStatsRequestSchema>;
export type RegenerateStatsResultType = z.infer<typeof RegenerateStatsResultSchema>;
