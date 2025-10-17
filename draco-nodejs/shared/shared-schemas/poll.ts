import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const PollOptionSchema = z.object({
  id: z
    .union([z.string().regex(/^\d+$/), z.bigint()])
    .transform((val) => (typeof val === 'bigint' ? val.toString() : val)),
  optionText: z.string().min(1).max(255),
  priority: z.number().int(),
  voteCount: z.number().int().nonnegative(),
});

export const AccountPollSchema = z.object({
  id: z.bigint().transform((val) => val.toString()),
  accountId: z.string(),
  question: z.string().min(1).max(255),
  active: z.boolean(),
  totalVotes: z.number().int().nonnegative(),
  options: z.array(PollOptionSchema),
  userVoteOptionId: z.string().optional().openapi({
    description:
      'Identifier of the option selected by the authenticated contact when retrieving polls scoped to a contact.',
  }),
});

const PollOptionBaseSchema = PollOptionSchema.omit({ voteCount: true });

export const PollOptionInputSchema = PollOptionBaseSchema.partial({
  id: true,
  priority: true,
});

const PollOptionCreateSchema = PollOptionInputSchema.omit({ id: true });

export const CreatePollSchema = z.object({
  question: AccountPollSchema.shape.question,
  active: AccountPollSchema.shape.active.optional().default(true),
  options: PollOptionCreateSchema.array().min(2, {
    message: 'A poll must include at least two options',
  }),
});

export const UpdatePollSchema = CreatePollSchema.partial()
  .merge(
    z.object({
      options: PollOptionInputSchema.array().optional(),
      deletedOptionIds: z.array(z.string()).optional(),
    }),
  )
  .refine((data) => {
    if (!data.question && data.active === undefined && !data.options && !data.deletedOptionIds) {
      return false;
    }
    return true;
  }, 'At least one field must be provided for update');

export const PollVoteRequestSchema = z.object({
  optionId: z.string(),
});

export type PollOptionType = z.infer<typeof PollOptionSchema>;
export type AccountPollType = z.infer<typeof AccountPollSchema>;
export type PollOptionInputType = z.infer<typeof PollOptionInputSchema>;
export type CreatePollType = z.infer<typeof CreatePollSchema>;
export type UpdatePollType = z.infer<typeof UpdatePollSchema>;
export type PollVoteRequestType = z.infer<typeof PollVoteRequestSchema>;
