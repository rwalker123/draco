import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { BaseContactSchema, ContactDetailsSchema } from './contact.js';
import { bigintToStringSchema } from './standardSchema.js';
import { TeamSeasonNameSchema, TeamSeasonSchema } from './team.js';
import { LeagueNameSchema, LeagueSeasonSchema } from './league.js';

extendZodWithOpenApi(z);

export const TeamManagerSchema = z
  .object({
    id: bigintToStringSchema,
    team: TeamSeasonNameSchema,
    contact: BaseContactSchema,
  })
  .openapi({
    description: 'Schema for a manager of a team for a given season',
  });

export const UpsertTeamManagerSchema = z.object({
  contactId: z.string().trim(),
});

export const SeasonManagerWithLeagueSchema = TeamManagerSchema.extend({
  league: LeagueSeasonSchema,
}).openapi({
  description: 'Team assignment for a season manager with league and team context',
});

export const SeasonManagerSchema = z
  .object({
    contact: BaseContactSchema.pick({
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    }).extend({
      contactDetails: ContactDetailsSchema.pick({
        phone1: true,
        phone2: true,
        phone3: true,
      }).optional(),
    }),
    hasValidEmail: z.boolean(),
    allTeams: TeamSeasonSchema.pick({
      league: true,
      id: true,
      name: true,
    }).array(),
  })
  .openapi({
    description: 'Aggregated view of a season manager and the teams they manage',
  });

export const SeasonManagerListSchema = z
  .object({
    managers: SeasonManagerSchema.array(),
    leagueNames: LeagueNameSchema.array(),
    teamNames: TeamSeasonNameSchema.array(),
  })
  .openapi({
    description: 'Payload returned when listing season managers for an account season',
  });

export type SeasonManagerType = z.infer<typeof SeasonManagerSchema>;
export type SeasonManagerListType = z.infer<typeof SeasonManagerListSchema>;
export type TeamManagerType = z.infer<typeof TeamManagerSchema>;
export type UpsertTeamManagerType = z.infer<typeof UpsertTeamManagerSchema>;
export type SeasonManagerWithLeagueType = z.infer<typeof SeasonManagerWithLeagueSchema>;
