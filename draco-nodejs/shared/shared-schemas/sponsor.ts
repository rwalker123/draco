import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const SPONSOR_OPTIONAL_STRING_MAX_LENGTH = 255;
export const SPONSOR_DESCRIPTION_MAX_LENGTH = 250;

const optionalString = () => z.string().trim().max(SPONSOR_OPTIONAL_STRING_MAX_LENGTH).optional();

export const CreateSponsorSchema = z
  .object({
    name: z.string().trim().min(1).max(50),
    streetAddress: optionalString(),
    cityStateZip: optionalString(),
    description: z.string().trim().max(SPONSOR_DESCRIPTION_MAX_LENGTH).optional(),
    email: z
      .string()
      .trim()
      .max(100)
      .optional()
      .refine((value) => !value || /^\S+@\S+\.\S+$/.test(value), {
        message: 'Email must be a valid email address',
      }),
    phone: optionalString(),
    fax: optionalString(),
    website: optionalString(),
  })
  .openapi({
    title: 'CreateSponsor',
    description: 'Payload to create or update a sponsor',
  });

export const SponsorSchema = CreateSponsorSchema.extend({
  id: z.string(),
  accountId: z.string(),
  teamId: z.string().optional(),
  photoUrl: z
    .string()
    .trim()
    .url()
    .optional()
    .openapi({ description: 'Public URL for the sponsor photo' }),
});

export const SponsorListSchema = z
  .object({
    sponsors: SponsorSchema.array(),
  })
  .openapi({
    title: 'SponsorListResponse',
    description: 'List response for sponsors',
  });

export type SponsorType = z.infer<typeof SponsorSchema>;
export type CreateSponsorType = z.infer<typeof CreateSponsorSchema>;
