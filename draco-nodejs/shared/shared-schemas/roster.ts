import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { BaseContactSchema, CreateContactSchema } from './contact.js';

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
    playerNumber: z.number().min(0).max(99).optional(),
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

export const CreateRosterMemberSchema = RosterMemberSchema.omit({
  id: true,
  inactive: true,
  dateAdded: true,
}).openapi({
  description: 'Schema for creating or updating a roster member',
});

export const UpdateRosterMemberSchema = z
  .object({
    playerNumber: z.number().min(0).max(99).optional(),
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
    playerNumber: z.number().min(0).max(99).nullable().optional(),
    firstName: z.string().trim().nullable().optional(),
    lastName: z.string().trim().nullable().optional(),
    middleName: z.string().trim().nullable().optional(),
    photoUrl: z.string().trim().nullable().optional(),
    gamesPlayed: z.number().int().min(0).nullable().optional(),
  })
  .openapi({
    description:
      'Public-safe roster member payload exposing only jersey number, player name, and optional photo URL.',
  });

export const PublicTeamRosterResponseSchema = z.object({
  teamSeason: z.object({
    id: z.bigint().transform((val) => val.toString()),
    name: z.string().trim(),
  }),
  rosterMembers: PublicRosterMemberSchema.array(),
});

// todo should have called these with Type at the end, like RosterPlayerType, etc.
export type RosterPlayerType = z.infer<typeof RosterPlayerSchema>;
export type RosterMemberType = z.infer<typeof RosterMemberSchema>;
export type CreateRosterMemberType = z.infer<typeof CreateRosterMemberSchema>;
export type UpdateRosterMemberType = z.infer<typeof UpdateRosterMemberSchema>;
export type SignRosterMemberType = z.infer<typeof SignRosterMemberSchema>;
export type TeamRosterMembersType = z.infer<typeof TeamRosterMembersSchema>;
export type PublicRosterMemberType = z.infer<typeof PublicRosterMemberSchema>;
export type PublicTeamRosterResponseType = z.infer<typeof PublicTeamRosterResponseSchema>;
