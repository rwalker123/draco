import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema, nameSchema } from './standardSchema.js';
import { GolfFlightSchema } from './golfFlight.js';
import { GolfRosterEntrySchema } from './golfRoster.js';
import { GolfMatchSchema } from './golfMatch.js';
import { GolfTeamStandingSchema } from './golfStandings.js';

extendZodWithOpenApi(z);

export const GolfTeamSchema = z
  .object({
    id: bigintToStringSchema,
    name: nameSchema,
    flight: GolfFlightSchema.optional(),
  })
  .openapi({
    title: 'GolfTeam',
    description: 'A golf team in a flight',
  });

export const GolfTeamWithRosterSchema = GolfTeamSchema.extend({
  roster: z.array(GolfRosterEntrySchema),
  playerCount: z.number().int().nonnegative(),
}).openapi({
  title: 'GolfTeamWithRoster',
  description: 'Golf team with full roster',
});

export const GolfTeamWithScheduleSchema = GolfTeamSchema.extend({
  upcomingMatches: z.array(GolfMatchSchema),
  completedMatches: z.array(GolfMatchSchema),
  standing: GolfTeamStandingSchema.optional(),
}).openapi({
  title: 'GolfTeamWithSchedule',
  description: 'Golf team with schedule and standing',
});

export const GolfTeamDetailSchema = GolfTeamSchema.extend({
  roster: z.array(GolfRosterEntrySchema),
  upcomingMatches: z.array(GolfMatchSchema),
  recentMatches: z.array(GolfMatchSchema),
  standing: GolfTeamStandingSchema.optional(),
}).openapi({
  title: 'GolfTeamDetail',
  description: 'Complete golf team details with roster, schedule, and standing',
});

export const CreateGolfTeamSchema = z
  .object({
    name: nameSchema,
  })
  .openapi({
    title: 'CreateGolfTeam',
    description: 'Data required to create a new golf team',
  });

export const UpdateGolfTeamSchema = CreateGolfTeamSchema.partial().openapi({
  title: 'UpdateGolfTeam',
  description: 'Data for updating an existing golf team',
});

export type GolfTeamType = z.infer<typeof GolfTeamSchema>;
export type GolfTeamWithRosterType = z.infer<typeof GolfTeamWithRosterSchema>;
export type GolfTeamWithScheduleType = z.infer<typeof GolfTeamWithScheduleSchema>;
export type GolfTeamDetailType = z.infer<typeof GolfTeamDetailSchema>;
export type CreateGolfTeamType = z.infer<typeof CreateGolfTeamSchema>;
export type UpdateGolfTeamType = z.infer<typeof UpdateGolfTeamSchema>;
