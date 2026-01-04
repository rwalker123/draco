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

export type GenderType = z.infer<typeof GenderSchema>;
export type GolferType = z.infer<typeof GolferSchema>;
export type UpdateGolferHomeCourseType = z.infer<typeof UpdateGolferHomeCourseSchema>;
