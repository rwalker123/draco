import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { PhoneNumberSchema } from './contact.js';
import { PagingSchema } from './paging.js';
import { numberQueryParam } from './queryParams.js';
import { bigintToStringSchema, nameSchema } from './standardSchema.js';

extendZodWithOpenApi(z);

const numericStringIdSchema = z
  .string()
  .trim()
  .regex(/^\d+$/, { message: 'Identifier must be a numeric string' });

const optionalPhotoUrlSchema = z.preprocess(
  (value) => {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    }

    return value;
  },
  z.string().trim().max(500, { message: 'Photo URL must be 500 characters or fewer' }).optional(),
);

const biographyHtmlSchema = z
  .string()
  .max(20000, { message: 'Biography must be 20000 characters or fewer' })
  .transform((value) => value.trim())
  .optional();

const criteriaTextSchema = z
  .string()
  .trim()
  .max(5000, { message: 'Criteria text must be 5000 characters or fewer' })
  .optional();

const currentYear = new Date().getFullYear();
const MAX_ELIGIBLE_CONTACTS_PAGE_SIZE = 50;

const yearInductedSchema = z
  .number()
  .int()
  .min(1900, { message: 'Year inducted must be 1900 or later' })
  .max(currentYear + 1, {
    message: `Year inducted cannot be more than one year beyond the current year (${currentYear})`,
  })
  .openapi({
    description: 'Calendar year the inductee entered the Hall of Fame.',
    example: currentYear,
  });

export const HofContactSummarySchema = z
  .object({
    id: numericStringIdSchema,
    firstName: nameSchema,
    lastName: nameSchema,
    displayName: z
      .string()
      .trim()
      .min(1, { message: 'Display name is required' })
      .max(200, { message: 'Display name must be 200 characters or fewer' }),
    photoUrl: optionalPhotoUrlSchema,
  })
  .openapi({
    description:
      'Minimal contact information surfaced for Hall of Fame inductees and eligible contacts.',
  });

export const HofMemberSchema = z
  .object({
    id: numericStringIdSchema,
    accountId: numericStringIdSchema,
    contactId: numericStringIdSchema,
    yearInducted: yearInductedSchema,
    biographyHtml: biographyHtmlSchema,
    contact: HofContactSummarySchema,
  })
  .openapi({
    description: 'Represents an inducted Hall of Fame member for an account.',
  });

export const HofClassSummarySchema = z
  .object({
    year: yearInductedSchema,
    memberCount: z.number().int().min(0, { message: 'Member count cannot be negative' }),
  })
  .openapi({
    description: 'Summary information for a single Hall of Fame class.',
  });

export const HofClassWithMembersSchema = HofClassSummarySchema.extend({
  members: HofMemberSchema.array(),
}).openapi({
  description:
    'Expanded Hall of Fame class information including the inductees for a specific year.',
});

const HofMemberInputBaseSchema = z.object({
  contactId: numericStringIdSchema,
  yearInducted: yearInductedSchema,
  biographyHtml: biographyHtmlSchema,
});

export const CreateHofMemberSchema = HofMemberInputBaseSchema.openapi({
  description: 'Payload for inducting a new Hall of Fame member.',
});

export const UpdateHofMemberSchema = HofMemberInputBaseSchema.omit({
  contactId: true,
})
  .extend({
    biographyHtml: biographyHtmlSchema,
  })
  .openapi({
    description: 'Payload for updating an existing Hall of Fame member.',
  });

const eligibleContactSearchSchema = z
  .string()
  .trim()
  .min(2, { message: 'Search term must be at least two characters' })
  .max(100, { message: 'Search term must be 100 characters or fewer' })
  .optional();

export const HofEligibleContactsQuerySchema = z
  .object({
    search: eligibleContactSearchSchema,
    page: numberQueryParam({ min: 1 }).optional(),
    pageSize: numberQueryParam({ min: 1, max: MAX_ELIGIBLE_CONTACTS_PAGE_SIZE }).optional(),
  })
  .openapi({
    description:
      'Query parameters for locating contacts eligible for Hall of Fame induction. Results are paginated.',
  });

export const HofEligibleContactsResponseSchema = z
  .object({
    contacts: HofContactSummarySchema.array(),
    pagination: PagingSchema.optional(),
  })
  .openapi({
    description: 'Paginated list of contacts eligible to be inducted into the Hall of Fame.',
  });

export const HofNominationQuerySchema = z
  .object({
    page: numberQueryParam({ min: 1 }).optional(),
    pageSize: numberQueryParam({ min: 1, max: MAX_ELIGIBLE_CONTACTS_PAGE_SIZE }).optional(),
  })
  .openapi({
    description: 'Pagination options when retrieving Hall of Fame nominations.',
  });

const RequiredPhoneNumberSchema = PhoneNumberSchema.superRefine((value, ctx) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Phone number is required',
    });
  }
});

const HofNominationBaseSchema = z.object({
  nominator: z
    .string()
    .trim()
    .min(1, { message: 'Nominator name is required' })
    .max(50, { message: 'Nominator name must be 50 characters or fewer' }),
  phoneNumber: RequiredPhoneNumberSchema,
  email: z
    .string()
    .trim()
    .email({ message: 'Email address must be valid' })
    .max(75, { message: 'Email address must be 75 characters or fewer' }),
  nominee: z
    .string()
    .trim()
    .min(1, { message: 'Nominee name is required' })
    .max(50, { message: 'Nominee name must be 50 characters or fewer' }),
  reason: z
    .string()
    .trim()
    .min(1, { message: 'Reason is required' })
    .max(5000, { message: 'Reason must be 5000 characters or fewer' }),
});

export const SubmitHofNominationSchema = HofNominationBaseSchema.openapi({
  description: 'Public payload for nominating a Hall of Fame candidate.',
});

export const HofNominationSchema = HofNominationBaseSchema.extend({
  id: bigintToStringSchema,
  accountId: bigintToStringSchema,
})
  .extend({
    submittedAt: z.string().datetime({ offset: true }).optional().openapi({
      description: 'ISO-8601 timestamp when the nomination was created.',
    }),
  })
  .openapi({
    description: 'Represents a stored Hall of Fame nomination submission.',
  });

export const HofNominationListSchema = z
  .object({
    nominations: HofNominationSchema.array(),
    total: z
      .number()
      .int()
      .nonnegative()
      .openapi({ description: 'Total number of nominations returned.' }),
    pagination: PagingSchema.optional(),
  })
  .openapi({
    description: 'Paginated list of Hall of Fame nominations.',
  });

export const HofNominationSetupSchema = z
  .object({
    accountId: bigintToStringSchema,
    enableNomination: z.boolean(),
    criteriaText: criteriaTextSchema,
  })
  .openapi({
    description: 'Hall of Fame nomination settings for an account.',
  });

export const UpdateHofNominationSetupSchema = z
  .object({
    enableNomination: z.boolean(),
    criteriaText: criteriaTextSchema,
  })
  .openapi({
    description: 'Payload for updating nomination availability and criteria messaging.',
  });

export type HofContactSummaryType = z.infer<typeof HofContactSummarySchema>;
export type HofMemberType = z.infer<typeof HofMemberSchema>;
export type HofClassSummaryType = z.infer<typeof HofClassSummarySchema>;
export type HofClassWithMembersType = z.infer<typeof HofClassWithMembersSchema>;
export type CreateHofMemberType = z.infer<typeof CreateHofMemberSchema>;
export type UpdateHofMemberType = z.infer<typeof UpdateHofMemberSchema>;
export type HofEligibleContactsQueryType = z.infer<typeof HofEligibleContactsQuerySchema>;
export type HofEligibleContactsResponseType = z.infer<typeof HofEligibleContactsResponseSchema>;
export type HofNominationQueryType = z.infer<typeof HofNominationQuerySchema>;
export type SubmitHofNominationType = z.infer<typeof SubmitHofNominationSchema>;
export type HofNominationType = z.infer<typeof HofNominationSchema>;
export type HofNominationListType = z.infer<typeof HofNominationListSchema>;
export type HofNominationSetupType = z.infer<typeof HofNominationSetupSchema>;
export type UpdateHofNominationSetupType = z.infer<typeof UpdateHofNominationSetupSchema>;
