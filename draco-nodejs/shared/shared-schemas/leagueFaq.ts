import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema } from './standardSchema.js';

extendZodWithOpenApi(z);

export const LEAGUE_FAQ_QUESTION_MAX_LENGTH = 150;
export const LEAGUE_FAQ_ANSWER_MAX_LENGTH = 1000;

const trimmedString = (maxLength: number, fieldLabel: string) =>
  z
    .string()
    .trim()
    .min(1, `${fieldLabel} is required`)
    .max(maxLength, `${fieldLabel} must be ${maxLength} characters or fewer`);

export const UpsertLeagueFaqSchema = z
  .object({
    question: trimmedString(LEAGUE_FAQ_QUESTION_MAX_LENGTH, 'Question'),
    answer: trimmedString(LEAGUE_FAQ_ANSWER_MAX_LENGTH, 'Answer'),
  })
  .openapi({
    title: 'UpsertLeagueFaq',
    description: 'Payload for creating or updating a league FAQ entry',
  });

export const LeagueFaqSchema = UpsertLeagueFaqSchema.extend({
  id: bigintToStringSchema,
  accountId: bigintToStringSchema,
}).openapi({
  title: 'LeagueFaq',
  description: 'League FAQ entry exposed to clients',
});

export const LeagueFaqListSchema = z.array(LeagueFaqSchema).openapi({
  title: 'LeagueFaqList',
  description: 'Collection of FAQ entries for a league account',
});

export type UpsertLeagueFaqType = z.infer<typeof UpsertLeagueFaqSchema>;
export type LeagueFaqType = z.infer<typeof LeagueFaqSchema>;
export type LeagueFaqListType = z.infer<typeof LeagueFaqListSchema>;
