import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { ContactRoleSchema } from './role.js';
import { PaginationSchema } from './paging.js';
import { booleanQueryParam } from './queryParams.js';
import { bigintToStringSchema, nameSchema } from './standardSchema.js';

extendZodWithOpenApi(z);

export const ContactIdSchema = z.object({
  id: bigintToStringSchema,
});

export const NamedContactSchema = ContactIdSchema.extend({
  firstName: nameSchema,
  lastName: nameSchema,
  middleName: z.string().trim().max(50).optional(),
});

export const PhoneNumberSchema = z
  .string()
  .trim()
  .transform((val) => {
    // If empty, return empty string
    if (!val || val.trim() === '') return '';

    // Extract only digits
    const digits = val.replace(/\D/g, '');

    // If no digits, return empty string
    if (digits.length === 0) return '';

    // If not exactly 10 digits, keep as-is for validation error
    if (digits.length !== 10) return val;

    // Format as (###) ###-####
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  })
  .refine(
    (val) => {
      if (val === '') return true; // Allow empty
      // Check if it matches the formatted pattern
      return /^\(\d{3}\) \d{3}-\d{4}$/.test(val);
    },
    {
      message: 'Phone number must be a valid 10-digit US phone number',
    },
  )
  .nullable()
  .default('');

// New interface for detailed contact information
export const ContactDetailsSchema = z.object({
  phone1: PhoneNumberSchema,
  phone2: PhoneNumberSchema,
  phone3: PhoneNumberSchema,
  streetAddress: z.string().trim().max(100).nullable().default(''),
  city: z.string().trim().max(50).nullable().default(''),
  state: z.string().trim().max(50).nullable().default(''),
  zip: z.string().trim().max(10).nullable().default(''),
  dateOfBirth: z.string().trim().nullable().default(''),
  firstYear: z.number().nullable().optional(),
});

// Canonical base Contact interface - single source of truth for Contact structure
export const BaseContactSchema = NamedContactSchema.extend({
  email: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.email().trim().max(100).optional(),
  ),
  userId: z.string().trim().max(50).optional(),
  photoUrl: z.preprocess((val) => (val === '' ? undefined : val), z.url().trim().optional()),
  contactDetails: ContactDetailsSchema.optional(),
});

// Interface for contact entry used in internal processing (extends base)
export const ContactSchema = BaseContactSchema.extend({
  contactroles: z.array(ContactRoleSchema).optional(),
  creatoraccountid: bigintToStringSchema.optional(),
});

export const RoleWithContactSchema = ContactRoleSchema.extend({
  accountId: bigintToStringSchema,
  contact: ContactIdSchema,
});

export const RoleWithContactsSchema = ContactRoleSchema.extend({
  accountId: bigintToStringSchema,
  contacts: ContactIdSchema.array(),
});

export const UserRolesSchema = z.object({
  globalRoles: z.string().array(),
  contactRoles: RoleWithContactSchema.array(),
});

export const ContactWithContactRolesSchema = BaseContactSchema.extend({
  roles: ContactRoleSchema.array(),
});

export const CreateContactSchema = BaseContactSchema.omit({
  id: true,
  userId: true,
  photoUrl: true,
}).extend({
  photo: z.string().trim().optional().openapi({
    type: 'string',
    format: 'binary',
    description: 'Contact photo file',
  }),
});

export const CreateContactRoleSchema = z.object({
  roleId: z.string().trim().max(50),
  roleData: z.string().transform((val) => BigInt(val)),
  contextName: nameSchema.optional(),
});

export const PagedContactSchema = z
  .object({
    contacts: BaseContactSchema.array(),
    total: z.number(),
    pagination: PaginationSchema.optional(),
  })
  .openapi({
    title: 'ContactResponse',
    description: 'Response for contact search',
  });

export const PublicContactSummarySchema = z.object({
  id: bigintToStringSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  photoUrl: z.string().trim().optional(),
});

export const PublicContactSearchResponseSchema = z.object({
  results: PublicContactSummarySchema.array(),
});

export const PublicContactSearchQuerySchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, 'query must be at least 1 character')
    .max(100, 'query must be at most 100 characters'),
  limit: z
    .string()
    .transform((val) => parseInt(val))
    .refine((val) => Number.isFinite(val) && val > 0, {
      message: 'limit must be a positive number',
    })
    .default(15),
});

export const TeamWithNameSchema = z.object({
  teamSeasonId: z.string(),
  teamName: z.string(),
  leagueName: z.string(),
});

// Team manager with associated teams (extends BaseContact)
export const TeamManagerWithTeamsSchema = BaseContactSchema.extend({
  teams: TeamWithNameSchema.array(),
});

// Clean return type for getAutomaticRoleHolders
export const AutomaticRoleHoldersSchema = z
  .object({
    accountOwner: BaseContactSchema, // NOT nullable - every account must have owner
    teamManagers: TeamManagerWithTeamsSchema.array(),
  })
  .openapi({
    title: 'AutomaticRoleHolders',
    description: 'Automatic role holders',
  });

export const ContactValidationSchema = CreateContactSchema.safeExtend({
  validationType: z.enum(['streetAddress', 'dateOfBirth']),
})
  .refine(
    (data) => {
      if (data.validationType === 'streetAddress') {
        return data.contactDetails?.streetAddress && data.contactDetails.streetAddress.length > 0;
      }
      return true;
    },
    {
      message: "Street address is required when validation type is 'streetAddress'",
      path: ['contactDetails.streetAddress'],
    },
  )
  .refine(
    (data) => {
      if (data.validationType === 'dateOfBirth') {
        return data.contactDetails?.dateOfBirth && data.contactDetails.dateOfBirth.length > 0;
      }
      return true;
    },
    {
      message: "Date of birth is required when validation type is 'dateOfBirth'",
      path: ['contactDetails.dateOfBirth'],
    },
  );

export const SignInUserNameSchema = z.email().trim().max(100);

export const SignInCredentialsSchema = z.object({
  userName: SignInUserNameSchema,
  password: z.string().trim().min(6).max(100),
  accountId: z.string().trim().optional(),
});

export const ContactValidationWithSignInSchema = ContactValidationSchema.safeExtend(
  SignInCredentialsSchema.shape,
);

export const RegisteredUserSchema = z.object({
  userId: z.string(),
  userName: SignInUserNameSchema,
  token: z.string().optional(),
  contact: BaseContactSchema.optional(),
});

/**
 * Auto-register request/response contracts
 */
export const AutoRegisterContactResponseSchema = z
  .object({
    status: z.enum([
      'linked-existing-user', // contact linked to an existing aspnet user with matching email
      'created-new-user', // new aspnet user created and linked
      'already-linked', // contact already had a userId
      'conflict-other-contact', // another contact in this account already linked to that user
      'missing-email', // contact has no email so cannot auto-register
      'manual-invite-sent', // we emailed instructions instead of auto-registering
    ]),
    contactId: bigintToStringSchema,
    userId: z.string().optional(),
    userName: SignInUserNameSchema.optional(),
    otherContactId: bigintToStringSchema.optional(),
    otherContactName: z.string().trim().optional(),
    message: z.string().trim().optional(),
  })
  .openapi({
    title: 'AutoRegisterContactResponse',
  });

export type AutoRegisterContactResponseType = z.infer<typeof AutoRegisterContactResponseSchema>;

export const RegisteredUserWithRolesSchema = RegisteredUserSchema.extend(UserRolesSchema.shape);

export const VerifyTokenRequestSchema = z.object({
  token: z.string().min(1),
});

export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

export const RoleCheckResponseSchema = z.object({
  hasRole: z.boolean(),
  roleLevel: z.string().optional(),
  context: z.string().optional(),
});

// Filter field options for advanced contact filtering
export const ContactFilterFieldSchema = z.enum([
  'lastName',
  'firstName',
  'firstYear',
  'birthYear',
  'zip',
]);

// Filter operations for advanced contact filtering
export const ContactFilterOpSchema = z.enum([
  'startsWith',
  'endsWith',
  'equals',
  'notEquals',
  'greaterThan',
  'greaterThanOrEqual',
  'lessThan',
  'lessThanOrEqual',
  'contains',
]);

// Numeric fields that support comparison operations
const NUMERIC_FILTER_FIELDS = ['firstYear', 'birthYear'] as const;

// Comparison operations that only work with numeric fields
const NUMERIC_ONLY_OPERATIONS = [
  'greaterThan',
  'greaterThanOrEqual',
  'lessThan',
  'lessThanOrEqual',
] as const;

export const ContactSearchParamsSchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    includeRoles: booleanQueryParam.optional().default(false),
    contactDetails: booleanQueryParam.optional().default(false),
    seasonId: z.string().trim().optional(),
    teamSeasonId: z.string().trim().optional(),
    onlyWithRoles: booleanQueryParam.optional().default(false),
    includeInactive: booleanQueryParam.optional().default(false),
    // Flat pagination params - API client serializes with style: 'form' producing flat query params
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(50),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
    // Advanced filter params
    filterField: ContactFilterFieldSchema.optional(),
    filterOp: ContactFilterOpSchema.optional(),
    filterValue: z.string().trim().max(100).optional(),
  })
  .refine(
    (data) => {
      // If no filter operation, no validation needed
      if (!data.filterOp || !data.filterField) return true;

      // Check if operation is numeric-only
      const isNumericOnlyOp = NUMERIC_ONLY_OPERATIONS.includes(
        data.filterOp as (typeof NUMERIC_ONLY_OPERATIONS)[number],
      );

      // If it's a numeric-only operation, the field must be numeric
      if (isNumericOnlyOp) {
        return NUMERIC_FILTER_FIELDS.includes(
          data.filterField as (typeof NUMERIC_FILTER_FIELDS)[number],
        );
      }

      return true;
    },
    {
      message:
        'Comparison operations (greaterThan, lessThan, etc.) are only valid for numeric fields (firstYear, birthYear)',
      path: ['filterOp'],
    },
  );

export type NamedContactType = z.infer<typeof NamedContactSchema>;
export type ContactDetailsType = z.infer<typeof ContactDetailsSchema>;
export type BaseContactType = z.infer<typeof BaseContactSchema>;
export type ContactRoleType = z.infer<typeof ContactRoleSchema>;
export type ContactType = z.infer<typeof ContactSchema>;
export type CreateContactType = z.infer<typeof CreateContactSchema>;
export type RoleWithContactType = z.infer<typeof RoleWithContactSchema>;
export type CreateContactRoleType = z.infer<typeof CreateContactRoleSchema>;
export type UserRolesType = z.infer<typeof UserRolesSchema>;
export type PagedContactType = z.infer<typeof PagedContactSchema>;
export type PublicContactSummaryType = z.infer<typeof PublicContactSummarySchema>;
export type PublicContactSearchResponseType = z.infer<typeof PublicContactSearchResponseSchema>;
export type PublicContactSearchQueryType = z.infer<typeof PublicContactSearchQuerySchema>;
export type TeamWithNameType = z.infer<typeof TeamWithNameSchema>;
export type TeamManagerWithTeamsType = z.infer<typeof TeamManagerWithTeamsSchema>;
export type AutomaticRoleHoldersType = z.infer<typeof AutomaticRoleHoldersSchema>;
export type ContactValidationType = z.infer<typeof ContactValidationSchema>;
export type ContactValidationWithSignInType = z.infer<typeof ContactValidationWithSignInSchema>;
export type SignInUserNameType = z.infer<typeof SignInUserNameSchema>;
export type SignInCredentialsType = z.infer<typeof SignInCredentialsSchema>;
export type RegisteredUserType = z.infer<typeof RegisteredUserSchema>;
export type ContactSearchParamsType = z.infer<typeof ContactSearchParamsSchema>;
export type ContactFilterFieldType = z.infer<typeof ContactFilterFieldSchema>;
export type ContactFilterOpType = z.infer<typeof ContactFilterOpSchema>;
export type RegisteredUserWithRolesType = z.infer<typeof RegisteredUserWithRolesSchema>;
export type ContactWithContactRolesType = z.infer<typeof ContactWithContactRolesSchema>;
export type VerifyTokenRequestType = z.infer<typeof VerifyTokenRequestSchema>;
export type ChangePasswordRequestType = z.infer<typeof ChangePasswordRequestSchema>;
export type RoleCheckResponseType = z.infer<typeof RoleCheckResponseSchema>;
