import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema, nameSchema } from './standardSchema.js';
import { NamedContactSchema } from './contact.js';

extendZodWithOpenApi(z);

export const GolfPlayerSchema = NamedContactSchema.extend({
  handicapIndex: z.number().nullable().optional(),
  photoUrl: z.string().url().nullable().optional(),
}).openapi({
  title: 'GolfPlayer',
  description: 'Golf player with handicap information',
});

export const GolfRosterEntrySchema = z
  .object({
    id: bigintToStringSchema,
    contactId: bigintToStringSchema,
    teamSeasonId: bigintToStringSchema,
    isActive: z.boolean().default(true),
    isSub: z.boolean().default(false),
    initialDifferential: z.number().nullable().optional(),
    player: GolfPlayerSchema,
  })
  .openapi({
    title: 'GolfRosterEntry',
    description: 'A player on a golf team roster',
  });

export const GolfSubstituteSchema = GolfRosterEntrySchema.extend({
  subSeasonId: bigintToStringSchema.nullable().optional(),
}).openapi({
  title: 'GolfSubstitute',
  description: 'A substitute player available for the flight',
});

export const GolfTeamRosterSchema = z
  .object({
    teamSeasonId: bigintToStringSchema,
    teamName: nameSchema,
    players: z.array(GolfRosterEntrySchema),
  })
  .openapi({
    title: 'GolfTeamRoster',
    description: 'Complete roster for a golf team',
  });

export const CreateGolfPlayerSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    middleName: z.string().trim().max(50).optional(),
    email: z.string().email().trim().max(100).optional(),
    initialDifferential: z.number().nullable().optional(),
    isSub: z.boolean().default(false),
  })
  .openapi({
    title: 'CreateGolfPlayer',
    description: 'Data required to create a new golf player',
  });

export const UpdateGolfPlayerSchema = CreateGolfPlayerSchema.partial()
  .extend({
    isActive: z.boolean().optional(),
  })
  .openapi({
    title: 'UpdateGolfPlayer',
    description: 'Data for updating an existing golf player',
  });

export const SignPlayerSchema = z
  .object({
    contactId: bigintToStringSchema,
    initialDifferential: z.number().nullable().optional(),
    isSub: z.boolean().default(false),
  })
  .openapi({
    title: 'SignPlayer',
    description: 'Data for signing an existing contact to a golf team',
  });

export const ReleasePlayerSchema = z
  .object({
    releaseAsSub: z.boolean().default(false),
  })
  .openapi({
    title: 'ReleasePlayer',
    description: 'Options for releasing a player from a team',
  });

export const AvailablePlayerSchema = NamedContactSchema.extend({
  email: z.string().email().trim().max(100).optional(),
}).openapi({
  title: 'AvailablePlayer',
  description: 'A contact available to be signed to a golf team',
});

export type GolfPlayerType = z.infer<typeof GolfPlayerSchema>;
export type GolfRosterEntryType = z.infer<typeof GolfRosterEntrySchema>;
export type GolfSubstituteType = z.infer<typeof GolfSubstituteSchema>;
export type GolfTeamRosterType = z.infer<typeof GolfTeamRosterSchema>;
export type CreateGolfPlayerType = z.infer<typeof CreateGolfPlayerSchema>;
export type UpdateGolfPlayerType = z.infer<typeof UpdateGolfPlayerSchema>;
export type SignPlayerType = z.infer<typeof SignPlayerSchema>;
export type ReleasePlayerType = z.infer<typeof ReleasePlayerSchema>;
export type AvailablePlayerType = z.infer<typeof AvailablePlayerSchema>;
