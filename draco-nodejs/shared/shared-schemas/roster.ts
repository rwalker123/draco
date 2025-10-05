import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { BaseContactSchema, CreateContactSchema } from './contact.js';

extendZodWithOpenApi(z);

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
    dateAdded: z.date().nullable().default(null),
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

// todo should have called these with Type at the end, like RosterPlayerType, etc.
export type RosterPlayerType = z.infer<typeof RosterPlayerSchema>;
export type RosterMemberType = z.infer<typeof RosterMemberSchema>;
export type CreateRosterMemberType = z.infer<typeof CreateRosterMemberSchema>;
export type SignRosterMemberType = z.infer<typeof SignRosterMemberSchema>;
export type TeamRosterMembersType = z.infer<typeof TeamRosterMembersSchema>;
