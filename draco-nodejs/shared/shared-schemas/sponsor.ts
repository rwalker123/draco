import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

const optionalString = () => z.string().trim().max(255).optional();

export const CreateSponsorSchema = z
  .object({
    name: z.string().trim().min(1).max(50),
    streetAddress: optionalString(),
    cityStateZip: optionalString(),
    description: z.string().trim().max(4000).optional(),
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
    teamId: z.string().trim().optional(),
    photo: z
      .string()
      .trim()
      .optional()
      .openapi({
        type: 'string',
        format: 'binary',
        description: 'Sponsor photo file',
      }),
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
}).omit({ photo: true });

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
