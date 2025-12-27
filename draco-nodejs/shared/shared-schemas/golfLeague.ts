import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema } from './standardSchema.js';
import { NamedContactSchema } from './contact.js';

extendZodWithOpenApi(z);

export const GolfScoringConfigSchema = z.object({
  indNetPerHolePts: z.number().int().default(0),
  indNetPerNinePts: z.number().int().default(0),
  indNetPerMatchPts: z.number().int().default(0),
  indNetTotalHolesPts: z.number().int().default(0),
  indNetAgainstFieldPts: z.number().int().default(0),
  indNetAgainstFieldDescPts: z.number().int().default(0),
  indActPerHolePts: z.number().int().default(0),
  indActPerNinePts: z.number().int().default(0),
  indActPerMatchPts: z.number().int().default(0),
  indActTotalHolesPts: z.number().int().default(0),
  indActAgainstFieldPts: z.number().int().default(0),
  indActAgainstFieldDescPts: z.number().int().default(0),
  teamNetPerHolePts: z.number().int().default(0),
  teamNetPerNinePts: z.number().int().default(0),
  teamNetPerMatchPts: z.number().int().default(0),
  teamNetTotalHolesPts: z.number().int().default(0),
  teamNetAgainstFieldPts: z.number().int().default(0),
  teamActPerHolePts: z.number().int().default(0),
  teamActPerNinePts: z.number().int().default(0),
  teamActPerMatchPts: z.number().int().default(0),
  teamActTotalHolesPts: z.number().int().default(0),
  teamActAgainstFieldPts: z.number().int().default(0),
  teamAgainstFieldDescPts: z.number().int().default(0),
  teamNetBestBallPerHolePts: z.number().int().default(0),
  teamActBestBallPerHolePts: z.number().int().default(0),
  useTeamScoring: z.boolean().default(true),
  useIndividualScoring: z.boolean().default(true),
});

export const GolfLeagueSetupSchema = z
  .object({
    id: bigintToStringSchema,
    accountId: bigintToStringSchema,
    leagueDay: z.number().int().min(0).max(6),
    firstTeeTime: z.string(),
    timeBetweenTeeTimes: z.number().int().min(5).max(30).default(10),
    holesPerMatch: z.number().int().min(9).max(18).default(9),
    teeOffFormat: z.number().int().default(0),
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
})
  .partial()
  .openapi({
    title: 'UpdateGolfLeagueSetup',
    description: 'Data for updating golf league setup',
  });

export type GolfScoringConfigType = z.infer<typeof GolfScoringConfigSchema>;
export type GolfLeagueSetupType = z.infer<typeof GolfLeagueSetupSchema>;
export type CreateGolfLeagueSetupType = z.infer<typeof CreateGolfLeagueSetupSchema>;
export type UpdateGolfLeagueSetupType = z.infer<typeof UpdateGolfLeagueSetupSchema>;
