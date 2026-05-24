import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { BaseContactSchema, CreateContactSchema } from './contact.js';
import { AccountHeaderSchema } from './account.js';

extendZodWithOpenApi(z);

const isoDateStringSchema = z
  .string()
  .trim()
  .refine(
    (value) => !Number.isNaN(Date.parse(value)),
    'dateAdded must be a valid ISO 8601 date-time string',
  )
  .openapi({ format: 'date-time' });

export const RosterPlayerSchema = z
  .object({
    id: z.bigint().transform((val) => val.toString()),
    submittedDriversLicense: z.boolean().default(false),
    firstYear: z.number().min(1900).max(new Date().getFullYear()),
    contact: BaseContactSchema,
  })
  .openapi({
    description:
      'Schema for a player who is or was on a team roster. This contains details that only ever need to be supplied once',
  });

export const RosterMemberSchema = z
  .object({
    id: z.bigint().transform((val) => val.toString()),
    playerNumber: z
      .string()
      .regex(/^\d{0,2}$/, 'Player number must be 0-2 digits')
      .optional(),
    inactive: z.boolean().default(false),
    submittedWaiver: z.boolean().optional(),
    dateAdded: isoDateStringSchema.nullable().default(null),
    gamesPlayed: z.number().int().min(0).optional(),
    player: RosterPlayerSchema,
    // todo: add team season summary info here eventually?
  })
  .openapi({
    description: 'Schema for a roster member including player details',
  });

export const TeamRosterMembersSchema = z.object({
  teamSeason: z.object({
    id: z.bigint().transform((val) => val.toString()),
    name: z.string().trim(),
  }),
  rosterMembers: RosterMemberSchema.array(),
});

export const RosterMemberSeasonTeamWaiverSchema = z
  .object({
    teamSeasonId: z.bigint().transform((val) => val.toString()),
    teamId: z.bigint().transform((val) => val.toString()),
    teamName: z.string().trim(),
    leagueSeasonId: z.bigint().transform((val) => val.toString()),
    leagueName: z.string().trim(),
    submittedWaiver: z.boolean(),
  })
  .openapi({
    description: 'Per-team waiver status for one of a player’s season teams. Admin-only data.',
  });

export const RosterMemberWaiverSummarySchema = z
  .object({
    rosterMember: RosterMemberSchema,
    seasonTeams: RosterMemberSeasonTeamWaiverSchema.array(),
  })
  .openapi({
    description:
      'Roster member augmented with the set of teams in the current season where the player has a roster row, including the submittedWaiver flag for each. Admin-only.',
  });

export const TeamRosterWaiverSummariesSchema = z
  .object({
    teamSeason: z.object({
      id: z.bigint().transform((val) => val.toString()),
      name: z.string().trim(),
    }),
    members: RosterMemberWaiverSummarySchema.array(),
  })
  .openapi({
    description:
      'Admin view of a team roster including cross-team waiver status per player for the current season.',
  });

export const CreateRosterMemberSchema = RosterMemberSchema.omit({
  id: true,
  inactive: true,
  dateAdded: true,
}).openapi({
  description: 'Schema for creating or updating a roster member',
});

export const UpdateRosterMemberSchema = z
  .object({
    playerNumber: z
      .string()
      .regex(/^\d{0,2}$/, 'Player number must be 0-2 digits')
      .optional(),
    submittedWaiver: z.boolean().optional(),
    player: z
      .object({
        submittedDriversLicense: z.boolean().optional(),
        firstYear: z.number().min(1900).max(new Date().getFullYear()).optional(),
      })
      .optional(),
  })
  .strict()
  .openapi({
    description: 'Schema for updating a roster member',
  });

export const SignRosterMemberSchema = RosterMemberSchema.omit({
  id: true,
  inactive: true,
  dateAdded: true,
  player: true,
})
  .extend({
    player: z.object({
      submittedDriversLicense: z.boolean(),
      firstYear: z.number().min(1900).max(new Date().getFullYear()),
      contact: z.union([
        z.object({
          id: z.string(),
        }),
        CreateContactSchema,
      ]),
    }),
  })
  .openapi({
    description: 'Schema for signing a contact to a roster and providing player details',
  });

export const PublicRosterMemberSchema = z
  .object({
    id: z.bigint().transform((val) => val.toString()),
    contactId: z.bigint().transform((val) => val.toString()),
    playerNumber: z
      .string()
      .regex(/^\d{0,2}$/, 'Player number must be 0-2 digits')
      .nullable()
      .optional(),
    firstName: z.string().trim().nullable().optional(),
    lastName: z.string().trim().nullable().optional(),
    middleName: z.string().trim().nullable().optional(),
    photoUrl: z.string().trim().nullable().optional(),
    gamesPlayed: z.number().int().min(0).nullable().optional(),
  })
  .openapi({
    description:
      'Public-safe roster member payload exposing jersey number, player name, optional photo URL, and the contact identifier needed to link to public player statistics.',
  });

export const PublicTeamRosterResponseSchema = z.object({
  teamSeason: z.object({
    id: z.bigint().transform((val) => val.toString()),
    name: z.string().trim(),
  }),
  rosterMembers: PublicRosterMemberSchema.array(),
});

export const RosterCardPlayerSchema = z.object({
  id: z.bigint().transform((val) => val.toString()),
  playerNumber: z
    .string()
    .regex(/^\d{0,2}$/, 'Player number must be 0-2 digits')
    .nullable()
    .optional(),
  firstName: z.string().trim(),
  lastName: z.string().trim(),
});

export const TeamRosterCardSchema = z.object({
  account: AccountHeaderSchema.partial(),
  teamSeason: z.object({
    id: z.bigint().transform((val) => val.toString()),
    name: z.string().trim(),
    leagueName: z.string().trim().nullable().optional(),
    seasonName: z.string().trim().nullable().optional(),
  }),
  players: RosterCardPlayerSchema.array(),
});

// todo should have called these with Type at the end, like RosterPlayerType, etc.
export type RosterPlayerType = z.infer<typeof RosterPlayerSchema>;
export type RosterMemberType = z.infer<typeof RosterMemberSchema>;
export type CreateRosterMemberType = z.infer<typeof CreateRosterMemberSchema>;
export type UpdateRosterMemberType = z.infer<typeof UpdateRosterMemberSchema>;
export type SignRosterMemberType = z.infer<typeof SignRosterMemberSchema>;
export type TeamRosterMembersType = z.infer<typeof TeamRosterMembersSchema>;
export type RosterMemberSeasonTeamWaiverType = z.infer<typeof RosterMemberSeasonTeamWaiverSchema>;
export type RosterMemberWaiverSummaryType = z.infer<typeof RosterMemberWaiverSummarySchema>;
export type TeamRosterWaiverSummariesType = z.infer<typeof TeamRosterWaiverSummariesSchema>;
export type PublicRosterMemberType = z.infer<typeof PublicRosterMemberSchema>;
export type PublicTeamRosterResponseType = z.infer<typeof PublicTeamRosterResponseSchema>;
export type RosterCardPlayerType = z.infer<typeof RosterCardPlayerSchema>;
export type TeamRosterCardType = z.infer<typeof TeamRosterCardSchema>;
