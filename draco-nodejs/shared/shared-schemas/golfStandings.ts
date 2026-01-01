import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema, nameSchema } from './standardSchema.js';

extendZodWithOpenApi(z);

export const GolfTeamStandingSchema = z
  .object({
    teamSeasonId: bigintToStringSchema,
    teamName: nameSchema,
    matchesPlayed: z.number().int(),
    matchesWon: z.number().int(),
    matchesLost: z.number().int(),
    matchesTied: z.number().int(),
    matchPoints: z.number(),
    strokePoints: z.number(),
    totalPoints: z.number(),
    totalStrokes: z.number().int(),
    averageScore: z.number().optional(),
    rank: z.number().int().optional(),
  })
  .openapi({
    title: 'GolfTeamStanding',
    description: 'Team standing in a golf league flight',
  });

export const GolfFlightStandingsSchema = z
  .object({
    flightId: bigintToStringSchema,
    flightName: nameSchema,
    standings: z.array(GolfTeamStandingSchema),
  })
  .openapi({
    title: 'GolfFlightStandings',
    description: 'Complete standings for a golf flight',
  });

export const GolfLeagueStandingsSchema = z
  .object({
    seasonId: bigintToStringSchema,
    flights: z.array(GolfFlightStandingsSchema),
  })
  .openapi({
    title: 'GolfLeagueStandings',
    description: 'Complete standings for all flights in a golf league',
  });

export type GolfTeamStandingType = z.infer<typeof GolfTeamStandingSchema>;
export type GolfFlightStandingsType = z.infer<typeof GolfFlightStandingsSchema>;
export type GolfLeagueStandingsType = z.infer<typeof GolfLeagueStandingsSchema>;
