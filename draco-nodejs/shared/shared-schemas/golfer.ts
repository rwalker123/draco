import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema } from './standardSchema.js';
import { GolfCourseSlimSchema } from './golfCourse.js';

extendZodWithOpenApi(z);

export const GolferSchema = z
  .object({
    id: bigintToStringSchema,
    contactId: bigintToStringSchema,
    initialDifferential: z.number().nullable().optional(),
    homeCourse: GolfCourseSlimSchema.nullable().optional(),
  })
  .openapi({
    title: 'Golfer',
    description: 'A golfer profile with optional home course',
  });

export const UpdateGolferHomeCourseSchema = z
  .object({
    homeCourseId: bigintToStringSchema.nullable(),
  })
  .openapi({
    title: 'UpdateGolferHomeCourse',
    description: 'Request to update a golfer home course',
  });

export type GolferType = z.infer<typeof GolferSchema>;
export type UpdateGolferHomeCourseType = z.infer<typeof UpdateGolferHomeCourseSchema>;
