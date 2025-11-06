import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema } from './standardSchema.js';

extendZodWithOpenApi(z);

export const ANNOUNCEMENT_TITLE_MAX_LENGTH = 100;
export const ANNOUNCEMENT_BODY_MAX_LENGTH = 5000;

const numericStringSchema = z
  .string()
  .trim()
  .regex(/^\d+$/, { message: 'Value must be a numeric string' });

const isoDateTimeStringSchema = z
  .string()
  .trim()
  .datetime({ offset: true })
  .openapi({ format: 'date-time', description: 'ISO 8601 timestamp string' });

export const AnnouncementVisibilitySchema = z
  .enum(['account', 'team'])
  .openapi({ description: 'Scope where the announcement is published' });

export const UpsertAnnouncementSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(
        ANNOUNCEMENT_TITLE_MAX_LENGTH,
        `Title must be ${ANNOUNCEMENT_TITLE_MAX_LENGTH} characters or fewer`,
      ),
    body: z
      .string()
      .trim()
      .min(1, 'Body text is required')
      .max(
        ANNOUNCEMENT_BODY_MAX_LENGTH,
        `Body must be ${ANNOUNCEMENT_BODY_MAX_LENGTH} characters or fewer`,
      ),
    publishedAt: isoDateTimeStringSchema,
    isSpecial: z.boolean().default(false),
  })
  .openapi({
    title: 'UpsertAnnouncement',
    description: 'Payload to create or update an announcement for an account or team',
  });

export const AnnouncementSchema = UpsertAnnouncementSchema.extend({
  id: bigintToStringSchema,
  accountId: bigintToStringSchema,
  teamId: bigintToStringSchema.optional(),
  visibility: AnnouncementVisibilitySchema,
}).openapi({
  title: 'Announcement',
  description: 'Announcement data shared between account and team contexts',
});

export const AnnouncementListSchema = z
  .object({
    announcements: AnnouncementSchema.array(),
  })
  .openapi({
    title: 'AnnouncementList',
    description: 'Collection wrapper for announcement responses',
  });

export const AnnouncementFiltersSchema = z
  .object({
    teamId: numericStringSchema.optional(),
    includeSpecialOnly: z.boolean().optional(),
  })
  .openapi({
    title: 'AnnouncementFilters',
    description: 'Optional filters when listing announcements',
  });

export type AnnouncementType = z.infer<typeof AnnouncementSchema>;
export type UpsertAnnouncementType = z.infer<typeof UpsertAnnouncementSchema>;
export type AnnouncementListType = z.infer<typeof AnnouncementListSchema>;
export type AnnouncementFiltersType = z.infer<typeof AnnouncementFiltersSchema>;
