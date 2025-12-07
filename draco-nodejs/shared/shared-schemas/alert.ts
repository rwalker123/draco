import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema } from './standardSchema.js';
import { isoDateTimeSchema } from './date.js';

extendZodWithOpenApi(z);

export const ALERT_MESSAGE_MAX_LENGTH = 500;

export const UpsertAlertSchema = z
  .object({
    message: z
      .string()
      .trim()
      .min(1, 'Alert message is required')
      .max(
        ALERT_MESSAGE_MAX_LENGTH,
        `Alert message must be ${ALERT_MESSAGE_MAX_LENGTH} characters or fewer`,
      ),
    isActive: z.boolean().default(true),
  })
  .openapi({
    title: 'UpsertAlert',
    description: 'Payload to create or update a global alert message.',
  });

export const AlertSchema = UpsertAlertSchema.extend({
  id: bigintToStringSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
}).openapi({
  title: 'Alert',
  description: 'System-wide alert message displayed to all accounts.',
});

export const AlertListSchema = z
  .object({
    alerts: AlertSchema.array(),
  })
  .openapi({
    title: 'AlertList',
    description: 'Collection of alerts.',
  });

export type AlertType = z.infer<typeof AlertSchema>;
export type UpsertAlertType = z.infer<typeof UpsertAlertSchema>;
export type AlertListType = z.infer<typeof AlertListSchema>;
