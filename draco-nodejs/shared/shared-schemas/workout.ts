import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { FieldSchema } from './index.js';

extendZodWithOpenApi(z);

export const WORKOUT_DEFAULT_LIST_LIMIT = 25;
export const WORKOUT_REGISTRATIONS_DEFAULT_LIMIT = 50;
export const WORKOUT_REGISTRATIONS_MAX_EXPORT = 10000;
export const WORKOUT_SOURCE_OPTION_MAX_LENGTH = 25;

const isoDateTimeStringSchema = z.iso.datetime().openapi({
  description: 'ISO 8601 date-time string',
});

export const WorkoutStatusSchema = z
  .enum(['upcoming', 'past', 'all'])
  .openapi({ description: 'Filter workouts by upcoming, past, or all statuses' });

export const WorkoutSummarySchema = z
  .object({
    id: z.bigint().transform((val) => val.toString()),
    workoutDesc: z.string(),
    workoutDate: isoDateTimeStringSchema,
    field: FieldSchema.optional().nullable(),
    registrationCount: z.number().int().nonnegative().optional(),
  })
  .openapi({
    title: 'WorkoutSummary',
    description: 'Public summary of a workout announcement',
  });

export const WorkoutSchema = WorkoutSummarySchema.extend({
  accountId: z.bigint().transform((val) => val.toString()),
  comments: z.string(),
}).openapi({
  title: 'Workout',
  description: 'Workout announcement with account context and comments',
});

export const UpsertWorkoutSchema = z
  .object({
    workoutDesc: z.string().trim().min(1).max(255),
    workoutDate: isoDateTimeStringSchema,
    fieldId: z
      .string()
      .trim()
      .regex(/^\d+$/, { message: 'fieldId must be a numeric string' })
      .nullable()
      .optional(),
    comments: z.string().trim().max(2000).optional(),
  })
  .openapi({
    title: 'UpsertWorkout',
    description: 'Payload required to create or update a workout announcement',
  });

const phoneSchema = z.string().trim().max(14).optional();

export const WorkoutRegistrationSchema = z
  .object({
    id: z.bigint().transform((val) => val.toString()),
    workoutId: z.bigint().transform((val) => val.toString()),
    name: z.string(),
    email: z.string(),
    age: z.number().int().nonnegative(),
    phone1: z.string().optional(),
    phone2: z.string().optional(),
    phone3: z.string().optional(),
    phone4: z.string().optional(),
    positions: z.string(),
    isManager: z.boolean(),
    whereHeard: z.string(),
    dateRegistered: isoDateTimeStringSchema,
  })
  .openapi({
    title: 'WorkoutRegistration',
    description: 'Registration record for a workout announcement',
  });

export const UpsertWorkoutRegistrationSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(100),
    age: z.coerce.number().int().nonnegative(),
    phone1: phoneSchema,
    phone2: phoneSchema,
    phone3: phoneSchema,
    phone4: phoneSchema,
    positions: z.string().trim().min(1).max(50),
    isManager: z.coerce.boolean(),
    whereHeard: z.string().trim().min(1).max(WORKOUT_SOURCE_OPTION_MAX_LENGTH),
  })
  .openapi({
    title: 'WorkoutRegistrationUpsert',
    description: 'Payload to create or update a workout registration',
  });

export const WorkoutRegistrationsSchema = z
  .object({
    registrations: WorkoutRegistrationSchema.array(),
    nextCursor: z.string().optional(),
  })
  .openapi({
    title: 'WorkoutRegistrations',
    description: 'Collection of workout registrations with optional pagination cursor',
  });

export const WorkoutSourceOptionSchema = z
  .string()
  .trim()
  .min(1)
  .max(WORKOUT_SOURCE_OPTION_MAX_LENGTH)
  .openapi({
    title: 'WorkoutSourceOption',
    description: 'Allowed where-heard option for workout registrations',
  });

export const WorkoutSourcesSchema = z
  .object({
    options: WorkoutSourceOptionSchema.array(),
  })
  .openapi({
    title: 'WorkoutSources',
    description: "Configured where-heard options for an account's workouts",
  });

export const WorkoutSourceOptionPayloadSchema = z
  .object({
    option: WorkoutSourceOptionSchema,
  })
  .openapi({
    title: 'WorkoutSourceOptionPayload',
    description: 'Payload containing a single where-heard option to append',
  });

export const WorkoutListQuerySchema = z
  .object({
    status: WorkoutStatusSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(WORKOUT_DEFAULT_LIST_LIMIT),
    after: z.string().trim().datetime().optional(),
    before: z.string().trim().datetime().optional(),
    includeRegistrationCounts: z.coerce.boolean().default(false),
  })
  .openapi({
    title: 'WorkoutListQuery',
    description: 'Query parameters to filter and paginate workout announcements',
  });

export const WorkoutRegistrationsQuerySchema = z
  .object({
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(WORKOUT_REGISTRATIONS_MAX_EXPORT)
      .default(WORKOUT_REGISTRATIONS_MAX_EXPORT),
  })
  .openapi({
    title: 'WorkoutRegistrationsQuery',
    description: 'Query parameters to paginate workout registrations',
  });

export type WorkoutStatusType = z.infer<typeof WorkoutStatusSchema>;
export type WorkoutSummaryType = z.infer<typeof WorkoutSummarySchema>;
export type WorkoutType = z.infer<typeof WorkoutSchema>;
export type UpsertWorkoutType = z.infer<typeof UpsertWorkoutSchema>;
export type WorkoutRegistrationType = z.infer<typeof WorkoutRegistrationSchema>;
export type UpsertWorkoutRegistrationType = z.infer<typeof UpsertWorkoutRegistrationSchema>;
export type WorkoutRegistrationsType = z.infer<typeof WorkoutRegistrationsSchema>;
export type WorkoutSourcesType = z.infer<typeof WorkoutSourcesSchema>;
export type WorkoutSourceOptionType = z.infer<typeof WorkoutSourceOptionSchema>;
export type WorkoutSourceOptionPayloadType = z.infer<typeof WorkoutSourceOptionPayloadSchema>;
export type WorkoutListQueryType = z.infer<typeof WorkoutListQuerySchema>;
export type WorkoutRegistrationsQueryType = z.infer<typeof WorkoutRegistrationsQuerySchema>;
