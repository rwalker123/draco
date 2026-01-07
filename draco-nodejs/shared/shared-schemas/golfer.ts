import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema } from './standardSchema.js';
import { GolfCourseSlimSchema } from './golfCourse.js';

extendZodWithOpenApi(z);

export const GenderSchema = z.enum(['M', 'F']).openapi({
  title: 'Gender',
  description: 'Golfer gender (M = Male, F = Female)',
});

export const GolferSchema = z
  .object({
    id: bigintToStringSchema,
    contactId: bigintToStringSchema,
    gender: GenderSchema.default('M'),
    initialDifferential: z.number().nullable().optional(),
    homeCourse: GolfCourseSlimSchema.nullable().optional(),
    handicapIndex: z.number().nullable().optional(),
    lowHandicapIndex: z.number().nullable().optional(),
    averageScore: z.number().nullable().optional(),
    roundsPlayed: z.number().optional(),
  })
  .openapi({
    title: 'Golfer',
    description: 'A golfer profile with optional home course and calculated stats',
  });

export const UpdateGolferHomeCourseSchema = z
  .object({
    homeCourseId: bigintToStringSchema.nullable(),
  })
  .openapi({
    title: 'UpdateGolferHomeCourse',
    description: 'Request to update a golfer home course',
  });

export const ContactIndividualGolfAccountSchema = z
  .object({
    accountId: bigintToStringSchema,
    accountName: z.string(),
    handicapIndex: z.number().nullable(),
    isInitialHandicap: z.boolean().default(false),
    averageScore: z.number().nullable(),
    roundsPlayed: z.number(),
  })
  .nullable()
  .openapi({
    title: 'ContactIndividualGolfAccount',
    description: 'Individual golf account summary for a contact, or null if no account exists',
  });

export type GenderType = z.infer<typeof GenderSchema>;
export type GolferType = z.infer<typeof GolferSchema>;
export type UpdateGolferHomeCourseType = z.infer<typeof UpdateGolferHomeCourseSchema>;
export type ContactIndividualGolfAccountType = z.infer<typeof ContactIndividualGolfAccountSchema>;
