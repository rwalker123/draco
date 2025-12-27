import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema, nameSchema } from './standardSchema.js';
import { SeasonNameSchema } from './seasonBase.js';

extendZodWithOpenApi(z);

export const GolfFlightSchema = z
  .object({
    id: bigintToStringSchema,
    name: nameSchema,
    season: SeasonNameSchema.optional(),
  })
  .openapi({
    title: 'GolfFlight',
    description: 'A flight/division within a golf league season',
  });

export const GolfFlightWithTeamCountSchema = GolfFlightSchema.extend({
  teamCount: z.number().int().nonnegative().optional(),
  playerCount: z.number().int().nonnegative().optional(),
}).openapi({
  title: 'GolfFlightWithTeamCount',
  description: 'Golf flight with team and player counts',
});

export const CreateGolfFlightSchema = z
  .object({
    name: nameSchema,
  })
  .openapi({
    title: 'CreateGolfFlight',
    description: 'Data required to create a new golf flight',
  });

export const UpdateGolfFlightSchema = CreateGolfFlightSchema.partial().openapi({
  title: 'UpdateGolfFlight',
  description: 'Data for updating an existing golf flight',
});

export type GolfFlightType = z.infer<typeof GolfFlightSchema>;
export type GolfFlightWithTeamCountType = z.infer<typeof GolfFlightWithTeamCountSchema>;
export type CreateGolfFlightType = z.infer<typeof CreateGolfFlightSchema>;
export type UpdateGolfFlightType = z.infer<typeof UpdateGolfFlightSchema>;
