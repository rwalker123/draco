import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema, nameSchema } from './standardSchema.js';

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

export type GolfDifferentialType = z.infer<typeof GolfDifferentialSchema>;
export type PlayerHandicapType = z.infer<typeof PlayerHandicapSchema>;
export type LeagueHandicapsType = z.infer<typeof LeagueHandicapsSchema>;
export type CourseHandicapType = z.infer<typeof CourseHandicapSchema>;
export type ESCMaxScoreType = z.infer<typeof ESCMaxScoreSchema>;
