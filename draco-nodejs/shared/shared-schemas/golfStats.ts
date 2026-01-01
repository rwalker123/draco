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

export const GolfFlightLeadersSchema = z
  .object({
    flightId: bigintToStringSchema,
    flightName: nameSchema,
    lowActualScore: z.array(GolfLeaderSchema),
    lowNetScore: z.array(GolfLeaderSchema),
    scoringAverages: z.array(GolfScoringAverageSchema),
    skins: z.array(GolfSkinsEntrySchema).optional(),
  })
  .openapi({
    title: 'GolfFlightLeaders',
    description: 'All leader categories for a flight',
  });

export type GolfStatDefType = z.infer<typeof GolfStatDefSchema>;
export type GolfLeaderType = z.infer<typeof GolfLeaderSchema>;
export type GolfLeaderboardType = z.infer<typeof GolfLeaderboardSchema>;
export type GolfSkinsEntryType = z.infer<typeof GolfSkinsEntrySchema>;
export type GolfSkinsLeaderboardType = z.infer<typeof GolfSkinsLeaderboardSchema>;
export type GolfScoringAverageType = z.infer<typeof GolfScoringAverageSchema>;
export type GolfFlightLeadersType = z.infer<typeof GolfFlightLeadersSchema>;
