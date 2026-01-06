import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema, nameSchema } from './standardSchema.js';

extendZodWithOpenApi(z);

const parValueSchema = z.number().int().min(3).max(6);
const handicapValueSchema = z.number().int().min(1).max(18);
const distanceValueSchema = z.number().int().min(0).max(700);
const ratingSchema = z.number().min(55).max(80);
const slopeSchema = z.number().int().min(55).max(155);

export const GolfCourseAddressSchema = z.object({
  address: z.string().trim().max(50).nullable().optional(),
  city: z.string().trim().max(50).nullable().optional(),
  state: z.string().trim().max(50).nullable().optional(),
  zip: z.string().trim().max(20).nullable().optional(),
  country: z.string().trim().max(30).nullable().optional(),
});

export const GolfCourseParSchema = z.object({
  mensPar: z.array(parValueSchema).length(18),
  womansPar: z.array(parValueSchema).length(18),
  mensHandicap: z.array(handicapValueSchema).length(18),
  womansHandicap: z.array(handicapValueSchema).length(18),
});

export const GolfCourseTeeRatingsSchema = z.object({
  mensRating: ratingSchema,
  mensSlope: slopeSchema,
  womansRating: ratingSchema,
  womansSlope: slopeSchema,
  mensRatingFront9: ratingSchema.optional(),
  mensSlopeFront9: slopeSchema.optional(),
  womansRatingFront9: ratingSchema.optional(),
  womansSlopeFront9: slopeSchema.optional(),
  mensRatingBack9: ratingSchema.optional(),
  mensSlopeBack9: slopeSchema.optional(),
  womansRatingBack9: ratingSchema.optional(),
  womansSlopeBack9: slopeSchema.optional(),
});

export const GolfCourseTeeSchema = z
  .object({
    id: bigintToStringSchema,
    courseId: bigintToStringSchema,
    teeColor: z.string().trim().max(20),
    teeName: z.string().trim().max(20),
    priority: z.number().int().default(0),
    distances: z.array(distanceValueSchema).length(18),
  })
  .extend(GolfCourseTeeRatingsSchema.shape)
  .openapi({
    title: 'GolfCourseTee',
    description: 'Tee information for a golf course including ratings, slopes, and hole distances',
  });

export const GolfCourseSchema = z
  .object({
    id: bigintToStringSchema,
    externalId: z.string().max(50).nullable().optional(),
    name: nameSchema,
    designer: z.string().trim().max(50).nullable().optional(),
    yearBuilt: z.number().int().nullable().optional(),
    numberOfHoles: z.number().int().min(9).max(18),
  })
  .extend(GolfCourseAddressSchema.shape)
  .extend(GolfCourseParSchema.shape)
  .openapi({
    title: 'GolfCourse',
    description: 'Golf course with par and handicap information for all 18 holes',
  });

export const GolfCourseWithTeesSchema = GolfCourseSchema.extend({
  tees: z.array(GolfCourseTeeSchema).optional(),
}).openapi({
  title: 'GolfCourseWithTees',
  description: 'Golf course with associated tee information',
});

export const GolfLeagueCourseSchema = z
  .object({
    accountId: bigintToStringSchema,
    course: GolfCourseSchema,
    defaultMensTeeId: bigintToStringSchema.nullable().optional(),
    defaultWomansTeeId: bigintToStringSchema.nullable().optional(),
  })
  .openapi({
    title: 'GolfLeagueCourse',
    description: 'Course associated with a golf league with default tee selections',
  });

export const CreateGolfCourseSchema = GolfCourseSchema.omit({
  id: true,
}).openapi({
  title: 'CreateGolfCourse',
  description: 'Data required to create a new golf course',
});

export const UpdateGolfCourseSchema = CreateGolfCourseSchema.partial().openapi({
  title: 'UpdateGolfCourse',
  description: 'Data for updating an existing golf course',
});

export const CreateGolfCourseTeeSchema = GolfCourseTeeSchema.omit({
  id: true,
  courseId: true,
}).openapi({
  title: 'CreateGolfCourseTee',
  description: 'Data required to create a new tee for a course',
});

export const UpdateGolfCourseTeeSchema = CreateGolfCourseTeeSchema.partial().openapi({
  title: 'UpdateGolfCourseTee',
  description: 'Data for updating an existing tee',
});

export const AddLeagueCourseSchema = z
  .object({
    courseId: bigintToStringSchema,
    defaultMensTeeId: bigintToStringSchema.nullable().optional(),
    defaultWomansTeeId: bigintToStringSchema.nullable().optional(),
  })
  .openapi({
    title: 'AddLeagueCourse',
    description: 'Data for adding an existing course to a league',
  });

export const UpdateTeePrioritiesSchema = z
  .object({
    priorities: z
      .array(
        z.object({
          id: bigintToStringSchema,
          priority: z.number().int(),
        }),
      )
      .min(1),
  })
  .openapi({
    title: 'UpdateTeePriorities',
    description: 'Request to update the display order of tees for a golf course',
  });

export const ImportExternalCourseSchema = z
  .object({
    externalId: z.string().min(1).max(50),
  })
  .openapi({
    title: 'ImportExternalCourse',
    description: 'Request to import a course from the external API by its ID',
  });

export const GolfCourseSlimSchema = z
  .object({
    id: bigintToStringSchema,
    name: nameSchema,
    address: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    isExternal: z.boolean().optional(),
  })
  .openapi({
    title: 'GolfCourseSlim',
    description: 'Minimal golf course info for match listings',
  });

export const GolfCourseTeeSlimSchema = z
  .object({
    id: bigintToStringSchema,
    teeName: z.string(),
    teeColor: z.string(),
  })
  .openapi({
    title: 'GolfCourseTeeSlim',
    description: 'Minimal tee info for match listings',
  });

export type GolfCourseAddressType = z.infer<typeof GolfCourseAddressSchema>;
export type GolfCourseParType = z.infer<typeof GolfCourseParSchema>;
export type GolfCourseTeeRatingsType = z.infer<typeof GolfCourseTeeRatingsSchema>;
export type GolfCourseTeeType = z.infer<typeof GolfCourseTeeSchema>;
export type GolfCourseType = z.infer<typeof GolfCourseSchema>;
export type GolfCourseWithTeesType = z.infer<typeof GolfCourseWithTeesSchema>;
export type GolfLeagueCourseType = z.infer<typeof GolfLeagueCourseSchema>;
export type CreateGolfCourseType = z.infer<typeof CreateGolfCourseSchema>;
export type UpdateGolfCourseType = z.infer<typeof UpdateGolfCourseSchema>;
export type CreateGolfCourseTeeType = z.infer<typeof CreateGolfCourseTeeSchema>;
export type UpdateGolfCourseTeeType = z.infer<typeof UpdateGolfCourseTeeSchema>;
export type AddLeagueCourseType = z.infer<typeof AddLeagueCourseSchema>;
export type UpdateTeePrioritiesType = z.infer<typeof UpdateTeePrioritiesSchema>;
export type ImportExternalCourseType = z.infer<typeof ImportExternalCourseSchema>;
export type GolfCourseSlimType = z.infer<typeof GolfCourseSlimSchema>;
export type GolfCourseTeeSlimType = z.infer<typeof GolfCourseTeeSlimSchema>;
