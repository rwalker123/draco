import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { PaginationWithTotalSchema } from './paging.js';
import { bigintToStringSchema, nameSchema } from './standardSchema.js';

const optionalLimitedString = (max: number) => z.string().trim().max(max).nullish();

const coordinateSchema = z.preprocess(
  (value) => {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length === 0 ? null : trimmed;
    }

    return value;
  },
  z.union([
    z
      .string()
      .trim()
      .max(25)
      .refine((value) => !Number.isNaN(Number.parseFloat(value)), {
        message: 'Coordinate must be a valid number',
      }),
    z.null(),
  ]),
);

extendZodWithOpenApi(z);

export const FieldNameSchema = z.object({
  id: bigintToStringSchema,
  name: nameSchema,
  shortName: z.string().trim().max(5),
});

export const FieldSchema = FieldNameSchema.extend({
  hasLights: z.boolean().optional().default(false),
  scheduleEnabled: z.boolean().optional().default(false),
  gameLengthMinutes: z.number().int().positive().max(1440).nullish(),
  bufferMinutes: z.number().int().min(0).max(1440).optional().default(0),
  address: optionalLimitedString(255),
  city: optionalLimitedString(25),
  state: optionalLimitedString(25),
  zip: optionalLimitedString(10),
  comment: optionalLimitedString(255),
  directions: optionalLimitedString(255),
  rainoutNumber: optionalLimitedString(15),
  latitude: coordinateSchema,
  longitude: coordinateSchema,
});

export const UpsertFieldSchema = FieldSchema.omit({
  id: true,
  scheduleEnabled: true,
  gameLengthMinutes: true,
  bufferMinutes: true,
});

export const FieldsSchema = z.object({
  fields: FieldSchema.array(),
  pagination: PaginationWithTotalSchema.optional(),
});

export type FieldType = z.infer<typeof FieldSchema>;
export type FieldsType = z.infer<typeof FieldsSchema>;
export type UpsertFieldType = z.infer<typeof UpsertFieldSchema>;

const hhmmSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be formatted as HH:mm')
  .openapi({ example: '18:30' });

const fieldScheduleDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD')
  .openapi({ type: 'string', format: 'date', example: '2026-04-01' });

const dayOfWeekSchema = z.number().int().min(0).max(6).openapi({
  example: 0,
  description: 'Day of week where 0=Mon ... 6=Sun.',
});

const fieldOpenHourRefinement = (
  data: { startTimeLocal: string; endTimeLocal: string },
  ctx: z.RefinementCtx,
) => {
  if (data.startTimeLocal >= data.endTimeLocal) {
    ctx.addIssue({
      code: 'custom',
      path: ['startTimeLocal'],
      message: 'startTimeLocal must be before endTimeLocal',
    });
  }
};

const FieldOpenHourBaseSchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  startTimeLocal: hhmmSchema,
  endTimeLocal: hhmmSchema,
});

export const FieldOpenHourSchema = FieldOpenHourBaseSchema.extend({
  id: bigintToStringSchema,
})
  .superRefine(fieldOpenHourRefinement)
  .openapi({ title: 'FieldOpenHour' });

export const FieldOpenHourUpsertSchema = FieldOpenHourBaseSchema.superRefine(
  fieldOpenHourRefinement,
).openapi({ title: 'FieldOpenHourUpsert' });

const FieldClosedDateBaseSchema = z.object({
  date: fieldScheduleDateSchema,
  endDate: fieldScheduleDateSchema
    .optional()
    .openapi({ description: 'Optional inclusive end of a closed range. Omit for a single day.' }),
  note: z.string().trim().min(1).max(255).nullish(),
});

const closedDateRefinement = (
  data: { date: string; endDate?: string | null },
  ctx: z.RefinementCtx,
) => {
  if (data.endDate && data.endDate < data.date) {
    ctx.addIssue({
      code: 'custom',
      path: ['endDate'],
      message: 'endDate must be on or after date',
    });
  }
};

export const FieldClosedDateSchema = FieldClosedDateBaseSchema.extend({
  id: bigintToStringSchema,
})
  .superRefine(closedDateRefinement)
  .openapi({ title: 'FieldClosedDate' });

export const FieldClosedDateUpsertSchema = FieldClosedDateBaseSchema.superRefine(
  closedDateRefinement,
).openapi({ title: 'FieldClosedDateUpsert' });

const fieldScheduleConfigRefinement = (
  data: { openHours: { dayOfWeek: number }[]; closedDates: { date: string }[] },
  ctx: z.RefinementCtx,
) => {
  const seenDays = new Set<number>();
  data.openHours.forEach((entry, index) => {
    if (seenDays.has(entry.dayOfWeek)) {
      ctx.addIssue({
        code: 'custom',
        path: ['openHours', index, 'dayOfWeek'],
        message: 'Each day of week may appear at most once',
      });
    }
    seenDays.add(entry.dayOfWeek);
  });

  const seenDates = new Set<string>();
  data.closedDates.forEach((entry, index) => {
    if (seenDates.has(entry.date)) {
      ctx.addIssue({
        code: 'custom',
        path: ['closedDates', index, 'date'],
        message: 'Each closed date may appear at most once',
      });
    }
    seenDates.add(entry.date);
  });
};

const fieldScheduleConfigScalars = {
  scheduleEnabled: z.boolean(),
  gameLengthMinutes: z.number().int().positive().max(1440).nullish(),
  bufferMinutes: z.number().int().min(0).max(1440),
};

export const FieldScheduleConfigSchema = z
  .object({
    fieldId: bigintToStringSchema,
    ...fieldScheduleConfigScalars,
    openHours: FieldOpenHourSchema.array(),
    closedDates: FieldClosedDateSchema.array(),
  })
  .openapi({
    title: 'FieldScheduleConfig',
    description:
      "A field's scheduling configuration: whether it is included in scheduling, its game length / buffer, weekly open hours, and one-off closed dates.",
  });

export const FieldScheduleConfigUpsertSchema = z
  .object({
    ...fieldScheduleConfigScalars,
    openHours: FieldOpenHourUpsertSchema.array(),
    closedDates: FieldClosedDateUpsertSchema.array(),
  })
  .superRefine(fieldScheduleConfigRefinement)
  .openapi({
    title: 'FieldScheduleConfigUpsert',
    description:
      "Full replacement of a field's scheduling configuration. The provided openHours and closedDates replace any existing rows for the field.",
  });

export const FieldScheduleConfigsSchema = z
  .object({
    configs: FieldScheduleConfigSchema.array(),
  })
  .openapi({
    title: 'FieldScheduleConfigs',
    description: 'Scheduling configuration for every field in an account.',
  });

export type FieldOpenHourType = z.infer<typeof FieldOpenHourSchema>;
export type FieldOpenHourUpsertType = z.infer<typeof FieldOpenHourUpsertSchema>;
export type FieldClosedDateType = z.infer<typeof FieldClosedDateSchema>;
export type FieldClosedDateUpsertType = z.infer<typeof FieldClosedDateUpsertSchema>;
export type FieldScheduleConfigType = z.infer<typeof FieldScheduleConfigSchema>;
export type FieldScheduleConfigUpsertType = z.infer<typeof FieldScheduleConfigUpsertSchema>;
export type FieldScheduleConfigsType = z.infer<typeof FieldScheduleConfigsSchema>;
