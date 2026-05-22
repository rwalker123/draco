import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema } from './standardSchema.js';

extendZodWithOpenApi(z);

export const RosterSeasonMembershipSchema = z
  .object({
    teamSeasonId: bigintToStringSchema,
    teamName: z.string().trim(),
    leagueSeasonId: bigintToStringSchema,
    leagueName: z.string().trim(),
    divisionSeasonId: bigintToStringSchema.nullable(),
    divisionName: z.string().trim().nullable(),
    jerseyNumber: z.string().nullable(),
  })
  .openapi({
    description:
      "A player's membership in a team for a specific season, including league and division context.",
  });

export const RosterSeasonMembershipListSchema = RosterSeasonMembershipSchema.array().openapi({
  description: "List of a player's team memberships for a season.",
});

export type RosterSeasonMembershipType = z.infer<typeof RosterSeasonMembershipSchema>;
export type RosterSeasonMembershipListType = z.infer<typeof RosterSeasonMembershipListSchema>;
