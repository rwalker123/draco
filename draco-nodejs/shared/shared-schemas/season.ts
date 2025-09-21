import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const SeasonSchema = z.object({
  id: z.bigint().transform((val) => val.toString()),
  name: z.string().trim().min(1).max(25),
  accountId: z.bigint().transform((val) => val.toString()),
});

export const CreateSeasonSchema = SeasonSchema.omit({
  id: true,
  accountId: true,
})
  .extend({
    accountId: z.string().transform((val) => BigInt(val)),
  })
  .openapi({
    description: 'Schema for creating a season',
  });

export type SeasonType = z.infer<typeof SeasonSchema>;
export type CreateSeasonType = z.infer<typeof CreateSeasonSchema>;
