import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema } from './standardSchema.js';

extendZodWithOpenApi(z);

export const HANDOUT_DESCRIPTION_MAX_LENGTH = 255;

const descriptionSchema = z
  .string()
  .trim()
  .min(1, 'Description is required')
  .max(HANDOUT_DESCRIPTION_MAX_LENGTH, `Description must be ${HANDOUT_DESCRIPTION_MAX_LENGTH} characters or fewer`);

export const UpsertHandoutSchema = z
  .object({
    description: descriptionSchema,
  })
  .openapi({
    title: 'UpsertHandout',
    description: 'Payload for creating or updating a handout record',
  });

export const HandoutSchema = UpsertHandoutSchema.extend({
  id: bigintToStringSchema,
  fileName: z
    .string()
    .trim()
    .min(1, 'File name is required')
    .max(255, 'File name must be 255 characters or fewer')
    .openapi({ description: 'Original file name associated with the handout' }),
  accountId: bigintToStringSchema,
  teamId: bigintToStringSchema.optional(),
  downloadUrl: z
    .string()
    .trim()
    .url()
    .openapi({ description: 'API endpoint to download the handout file' }),
}).openapi({
  title: 'Handout',
  description: 'Represents a downloadable handout file for an account or team',
});

export const HandoutListSchema = z
  .object({
    handouts: HandoutSchema.array(),
  })
  .openapi({
    title: 'HandoutList',
    description: 'List of handouts available in the requested context',
  });

export type HandoutType = z.infer<typeof HandoutSchema>;
export type UpsertHandoutType = z.infer<typeof UpsertHandoutSchema>;
