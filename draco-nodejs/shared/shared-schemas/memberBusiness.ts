import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const MEMBER_BUSINESS_NAME_MAX_LENGTH = 50;
export const MEMBER_BUSINESS_ADDRESS_MAX_LENGTH = 100;
export const MEMBER_BUSINESS_DESCRIPTION_MAX_LENGTH = 1000;
export const MEMBER_BUSINESS_EMAIL_MAX_LENGTH = 100;
export const MEMBER_BUSINESS_PHONE_MAX_LENGTH = 14;
export const MEMBER_BUSINESS_WEBSITE_MAX_LENGTH = 100;

const optionalTrimmedString = (maxLength: number) => z.string().trim().max(maxLength).optional();

const optionalWebsiteString = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .refine((value) => !value || /^https?:\/\//i.test(value), {
      message: 'Website must start with http:// or https://',
    });

export const CreateMemberBusinessSchema = z
  .object({
    contactId: z
      .string()
      .trim()
      .min(1)
      .openapi({ description: 'Contact ID associated with the business' }),
    name: z.string().trim().min(1).max(MEMBER_BUSINESS_NAME_MAX_LENGTH),
    streetAddress: optionalTrimmedString(MEMBER_BUSINESS_ADDRESS_MAX_LENGTH),
    cityStateZip: optionalTrimmedString(MEMBER_BUSINESS_ADDRESS_MAX_LENGTH),
    description: optionalTrimmedString(MEMBER_BUSINESS_DESCRIPTION_MAX_LENGTH),
    email: z
      .string()
      .trim()
      .max(MEMBER_BUSINESS_EMAIL_MAX_LENGTH)
      .optional()
      .refine((value) => !value || /^\S+@\S+\.\S+$/.test(value), {
        message: 'Email must be a valid email address',
      }),
    phone: optionalTrimmedString(MEMBER_BUSINESS_PHONE_MAX_LENGTH),
    fax: optionalTrimmedString(MEMBER_BUSINESS_PHONE_MAX_LENGTH),
    website: optionalWebsiteString(MEMBER_BUSINESS_WEBSITE_MAX_LENGTH),
  })
  .openapi({
    title: 'CreateMemberBusiness',
    description: 'Payload to create or update a member business entry',
  });

export const MemberBusinessSchema = CreateMemberBusinessSchema.extend({
  id: z.string(),
  accountId: z.string(),
  contactId: z.string(),
}).openapi({
  title: 'MemberBusiness',
  description: 'Member business record associated with a contact',
});

export const MemberBusinessListSchema = z
  .object({
    memberBusinesses: MemberBusinessSchema.array(),
  })
  .openapi({
    title: 'MemberBusinessList',
    description: 'List response for member businesses',
  });

export const MemberBusinessQueryParamsSchema = z
  .object({
    contactId: z.string().trim().optional(),
  })
  .openapi({
    title: 'MemberBusinessQueryParams',
    description: 'Optional filters for member business listings',
  });

export type CreateMemberBusinessType = z.infer<typeof CreateMemberBusinessSchema>;
export type MemberBusinessType = z.infer<typeof MemberBusinessSchema>;
