import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { BaseContactSchema } from './contact.js';

extendZodWithOpenApi(z);

export const TeamManagerSchema = z
  .object({
    id: z.bigint().transform((val) => val.toString()),
    teamSeasonId: z.bigint().transform((val) => val.toString()),
    contact: BaseContactSchema,
  })
  .openapi({
    description: 'Schema for a manager of a team for a given season',
  });

export const CreateTeamManagerSchema = TeamManagerSchema.omit({
  id: true,
  contact: true,
  teamSeasonId: true,
})
  .extend({
    contact: z.object({
      id: z.bigint().transform((val) => val.toString()),
    }),
  })
  .openapi({
    description: 'Schema for creating a manager',
  });

export type TeamManagerType = z.infer<typeof TeamManagerSchema>;
export type CreateTeamManagerType = z.infer<typeof CreateTeamManagerSchema>;
