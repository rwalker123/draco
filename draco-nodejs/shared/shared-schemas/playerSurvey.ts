import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { PaginationWithTotalSchema } from './paging.js';
import { PublicContactSummarySchema } from './contact.js';
import { bigintToStringSchema, nameSchema } from './standardSchema.js';

extendZodWithOpenApi(z);

const idStringSchema = z.string().trim().regex(/^\d+$/, 'Identifier must be a numeric string');

const surveyQuestionTextSchema = z
  .string()
  .trim()
  .min(1, 'Question text is required')
  .max(255, 'Question text must be 255 characters or less');

const surveyAnswerTextSchema = z
  .string()
  .trim()
  .min(1, 'Answer is required')
  .max(2000, 'Answer must be 2000 characters or less');

export const PlayerSurveyQuestionSchema = z
  .object({
    id: bigintToStringSchema,
    categoryId: bigintToStringSchema,
    question: surveyQuestionTextSchema,
    questionNumber: z
      .number()
      .int()
      .min(1, 'Question number must be at least 1')
      .max(999, 'Question number must be less than 1000'),
  })
  .openapi({
    title: 'PlayerSurveyQuestion',
    description: 'Survey question within a category, including ordering metadata.',
  });

export const PlayerSurveyCategorySchema = z
  .object({
    id: bigintToStringSchema,
    accountId: bigintToStringSchema,
    categoryName: nameSchema.max(40, 'Category name must be 40 characters or less'),
    priority: z.number().int(),
    questions: PlayerSurveyQuestionSchema.array().default([]),
  })
  .openapi({
    title: 'PlayerSurveyCategory',
    description: 'Survey category with associated questions for an account.',
  });

export const CreatePlayerSurveyCategorySchema = z
  .object({
    categoryName: PlayerSurveyCategorySchema.shape.categoryName,
    priority: PlayerSurveyCategorySchema.shape.priority.default(0),
  })
  .openapi({
    title: 'CreatePlayerSurveyCategory',
    description: 'Payload to create a new survey category.',
  });

export const UpdatePlayerSurveyCategorySchema = CreatePlayerSurveyCategorySchema.partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update the category.',
  })
  .openapi({
    title: 'UpdatePlayerSurveyCategory',
    description: 'Payload to update an existing survey category.',
  });

export const CreatePlayerSurveyQuestionSchema = z
  .object({
    categoryId: idStringSchema,
    question: surveyQuestionTextSchema,
    questionNumber: PlayerSurveyQuestionSchema.shape.questionNumber,
  })
  .openapi({
    title: 'CreatePlayerSurveyQuestion',
    description: 'Payload to create a new survey question under a category.',
  });

export const UpdatePlayerSurveyQuestionSchema = CreatePlayerSurveyQuestionSchema.omit({
  categoryId: true,
})
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update the question.',
  })
  .openapi({
    title: 'UpdatePlayerSurveyQuestion',
    description: 'Payload to update an existing survey question.',
  });

export const PlayerSurveyAnswerSchema = z
  .object({
    questionId: PlayerSurveyQuestionSchema.shape.id,
    categoryId: PlayerSurveyCategorySchema.shape.id,
    categoryName: PlayerSurveyCategorySchema.shape.categoryName,
    question: PlayerSurveyQuestionSchema.shape.question,
    questionNumber: PlayerSurveyQuestionSchema.shape.questionNumber,
    answer: surveyAnswerTextSchema,
  })
  .openapi({
    title: 'PlayerSurveyAnswer',
    description: 'Answer to a survey question including category context.',
  });

export const PlayerSurveyAnswerUpsertSchema = z
  .object({
    answer: surveyAnswerTextSchema,
  })
  .openapi({
    title: 'PlayerSurveyAnswerUpsert',
    description: 'Payload to create or update a player survey answer.',
  });

export const PlayerSurveyDetailSchema = z
  .object({
    player: PublicContactSummarySchema,
    answers: PlayerSurveyAnswerSchema.array(),
    lastUpdatedAt: z.string().datetime().optional(),
  })
  .openapi({
    title: 'PlayerSurveyDetail',
    description: 'Full set of answers for a player.',
  });

export const PlayerSurveyListResponseSchema = z
  .object({
    surveys: PlayerSurveyDetailSchema.array(),
    pagination: PaginationWithTotalSchema,
  })
  .openapi({
    title: 'PlayerSurveyListResponse',
    description: 'Paginated list of player surveys.',
  });

export const PlayerSurveyListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z
      .string()
      .trim()
      .min(1, 'Search must be at least 1 character')
      .max(100, 'Search must be less than 100 characters')
      .optional(),
  })
  .openapi({
    title: 'PlayerSurveyListQuery',
    description: 'Query parameters for listing player surveys.',
  });

export const PlayerSurveySpotlightSchema = z
  .object({
    player: PublicContactSummarySchema,
    question: PlayerSurveyQuestionSchema.shape.question,
    answer: PlayerSurveyAnswerSchema.shape.answer,
    teamName: nameSchema.optional(),
  })
  .openapi({
    title: 'PlayerSurveySpotlight',
    description: 'Randomly selected player survey highlight for widgets.',
  });

export type PlayerSurveyQuestionType = z.infer<typeof PlayerSurveyQuestionSchema>;
export type PlayerSurveyCategoryType = z.infer<typeof PlayerSurveyCategorySchema>;
export type CreatePlayerSurveyCategoryType = z.infer<typeof CreatePlayerSurveyCategorySchema>;
export type UpdatePlayerSurveyCategoryType = z.infer<typeof UpdatePlayerSurveyCategorySchema>;
export type CreatePlayerSurveyQuestionType = z.infer<typeof CreatePlayerSurveyQuestionSchema>;
export type UpdatePlayerSurveyQuestionType = z.infer<typeof UpdatePlayerSurveyQuestionSchema>;
export type PlayerSurveyAnswerType = z.infer<typeof PlayerSurveyAnswerSchema>;
export type PlayerSurveyAnswerUpsertType = z.infer<typeof PlayerSurveyAnswerUpsertSchema>;
export type PlayerSurveyDetailType = z.infer<typeof PlayerSurveyDetailSchema>;
export type PlayerSurveyListResponseType = z.infer<typeof PlayerSurveyListResponseSchema>;
export type PlayerSurveyListQueryType = z.infer<typeof PlayerSurveyListQuerySchema>;
export type PlayerSurveySpotlightType = z.infer<typeof PlayerSurveySpotlightSchema>;
