import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema } from './standardSchema.js';
import { NamedContactSchema } from './contact.js';

extendZodWithOpenApi(z);

export const ScoringTypeEnum = z.enum(['individual', 'team']);
export const AbsentPlayerModeEnum = z.enum(['opponentWins', 'handicapPenalty', 'skipPairing']);
export const FullTeamAbsentModeEnum = z.enum(['forfeit', 'handicapPenalty']);

export const GolfScoringConfigSchema = z.object({
  scoringType: ScoringTypeEnum.default('team'),
  useBestBall: z.boolean().default(false),
  useHandicapScoring: z.boolean().default(true),
  perHolePoints: z.number().int().default(0),
  perNinePoints: z.number().int().default(0),
  perMatchPoints: z.number().int().default(0),
  totalHolesPoints: z.number().int().default(0),
  againstFieldPoints: z.number().int().default(0),
  againstFieldDescPoints: z.number().int().default(0),
  absentPlayerMode: AbsentPlayerModeEnum.default('opponentWins'),
  absentPlayerPenalty: z.number().int().min(0).max(36).default(0),
  fullTeamAbsentMode: FullTeamAbsentModeEnum.default('forfeit'),
});

export const GolfLeagueSetupSchema = z
  .object({
    id: bigintToStringSchema,
    accountId: bigintToStringSchema,
    seasonId: bigintToStringSchema,
    leagueSeasonId: bigintToStringSchema,
    leagueDay: z.number().int().min(0).max(6),
    firstTeeTime: z.string(),
    timeBetweenTeeTimes: z.number().int().min(5).max(30).default(10),
    holesPerMatch: z.number().int().min(9).max(18).default(9),
    teeOffFormat: z.number().int().default(0),
    teamSize: z.number().int().min(1).max(4).default(2),
    president: NamedContactSchema.optional(),
    vicePresident: NamedContactSchema.optional(),
    secretary: NamedContactSchema.optional(),
    treasurer: NamedContactSchema.optional(),
  })
  .extend(GolfScoringConfigSchema.shape)
  .openapi({
    title: 'GolfLeagueSetup',
    description: 'Golf league configuration including tee times, scoring options, and officers',
  });

export const CreateGolfLeagueSetupSchema = GolfLeagueSetupSchema.omit({
  id: true,
  president: true,
  vicePresident: true,
  secretary: true,
  treasurer: true,
}).extend({
  presidentId: bigintToStringSchema.optional(),
  vicePresidentId: bigintToStringSchema.optional(),
  secretaryId: bigintToStringSchema.optional(),
  treasurerId: bigintToStringSchema.optional(),
});

export const UpdateGolfLeagueSetupSchema = CreateGolfLeagueSetupSchema.omit({
  accountId: true,
  seasonId: true,
  leagueSeasonId: true,
})
  .partial()
  .openapi({
    title: 'UpdateGolfLeagueSetup',
    description: 'Data for updating golf league setup',
  });

export const GolfAccountInfoSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    accountTypeName: z.string(),
    hasGolfSetup: z.boolean(),
  })
  .openapi({
    title: 'GolfAccountInfo',
    description: 'Golf account information',
  });

export const GolfSeasonConfigSchema = z
  .object({
    id: bigintToStringSchema,
    leagueSeasonId: bigintToStringSchema,
    teamSize: z.number().int().min(1).max(4).default(2),
  })
  .openapi({
    title: 'GolfSeasonConfig',
    description: 'Golf season-specific configuration',
  });

export const CreateGolfSeasonConfigSchema = GolfSeasonConfigSchema.omit({
  id: true,
});

export const UpdateGolfSeasonConfigSchema = GolfSeasonConfigSchema.omit({
  id: true,
  leagueSeasonId: true,
}).partial();

export type ScoringType = z.infer<typeof ScoringTypeEnum>;
export type AbsentPlayerModeType = z.infer<typeof AbsentPlayerModeEnum>;
export type FullTeamAbsentModeType = z.infer<typeof FullTeamAbsentModeEnum>;
export type GolfScoringConfigType = z.infer<typeof GolfScoringConfigSchema>;
export type GolfLeagueSetupType = z.infer<typeof GolfLeagueSetupSchema>;
export type CreateGolfLeagueSetupType = z.infer<typeof CreateGolfLeagueSetupSchema>;
export type UpdateGolfLeagueSetupType = z.infer<typeof UpdateGolfLeagueSetupSchema>;
export type GolfAccountInfoType = z.infer<typeof GolfAccountInfoSchema>;
export type GolfSeasonConfigType = z.infer<typeof GolfSeasonConfigSchema>;
export type CreateGolfSeasonConfigType = z.infer<typeof CreateGolfSeasonConfigSchema>;
export type UpdateGolfSeasonConfigType = z.infer<typeof UpdateGolfSeasonConfigSchema>;
