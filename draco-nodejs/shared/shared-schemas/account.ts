import { z } from 'zod';
import { NamedContactSchema } from './contact.js';

const queryValueSchema = z
  .string()
  .trim()
  .min(1, { message: 'Search query is required' })
  .max(100, { message: 'Search query must be 100 characters or fewer' });

export const AccountSearchQueryParamSchema = queryValueSchema;
export type AccountSearchQueryParamType = z.infer<typeof AccountSearchQueryParamSchema>;

export const AccountSearchQuerySchema = z.object({
  q: z.preprocess((value) => {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }, queryValueSchema),
});

export type AccountSearchQueryType = z.infer<typeof AccountSearchQuerySchema>;

export const AccountUrlSchema = z.object({
  id: z.string(),
  url: z.string().min(1),
});

export type AccountUrlType = z.infer<typeof AccountUrlSchema>;

export const AccountAffiliationSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().nullable().optional(),
});

export type AccountAffiliationType = z.infer<typeof AccountAffiliationSchema>;

export const AccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  accountType: z.string().optional(),
  firstYear: z.number().int().nullable(),
  affiliation: AccountAffiliationSchema.optional(),
  urls: z.array(AccountUrlSchema),
  accountOwner: NamedContactSchema.optional(),
});

export type AccountType = z.infer<typeof AccountSchema>;
