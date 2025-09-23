import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { ContactRoleSchema } from './role.js';

extendZodWithOpenApi(z);

export const ContactIdSchema = z.object({
  id: z.bigint().transform((val) => val.toString()),
});

export const NamedContactSchema = ContactIdSchema.extend({
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
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
  creatoraccountid: z
    .bigint()
    .transform((val) => val.toString())
    .optional(),
});

export const RoleWithContactSchema = ContactRoleSchema.extend({
  accountId: z.bigint().transform((val) => val.toString()),
  contact: ContactIdSchema,
});

export const RoleWithContactsSchema = ContactRoleSchema.extend({
  accountId: z.bigint().transform((val) => val.toString()),
  contacts: ContactIdSchema.array(),
});

export const UserRolesSchema = z.object({
  globalRoles: z.string().array(),
  contactRoles: RoleWithContactSchema.array(),
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
  contextName: z.string().trim().max(50).optional(),
});

export const PagedContactSchema = z
  .object({
    contacts: BaseContactSchema.array(),
    total: z.number(),
    pagination: z
      .object({
        page: z.number(),
        limit: z.number(),
        hasNext: z.boolean(),
        hasPrev: z.boolean(),
      })
      .optional(),
  })
  .openapi({
    title: 'ContactResponse',
    description: 'Response for contact search',
  });

export const TeamWithNameSchema = z.object({
  teamSeasonId: z.string(),
  teamName: z.string(),
});

// Team manager with associated teams (extends BaseContact)
export const TeamManagerWithTeams = BaseContactSchema.extend({
  teams: TeamWithNameSchema.array(),
});

// Clean return type for getAutomaticRoleHolders
export const AutomaticRoleHoldersSchema = z
  .object({
    accountOwner: BaseContactSchema, // NOT nullable - every account must have owner
    teamManagers: TeamManagerWithTeams.array(),
  })
  .openapi({
    title: 'AutomaticRoleHolders',
    description: 'Automatic role holders',
  });

const booleanQueryParam = z.preprocess((value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }

  return undefined;
}, z.boolean().optional());

export const ContactDeletionQuerySchema = z
  .object({
    force: booleanQueryParam.default(false),
    check: booleanQueryParam.default(false),
  })
  .openapi({
    title: 'ContactDeletionQuery',
    description: 'Query parameters controlling deletion vs preview behaviour',
  });

export const ContactDependencySchema = z
  .object({
    table: z.string(),
    count: z.number().int().nonnegative(),
    description: z.string(),
    riskLevel: z.enum(['critical', 'high', 'medium', 'low']),
  })
  .openapi({
    title: 'ContactDependency',
    description: 'Dependency record referencing related data preventing contact deletion',
  });

export const ContactDependencyCheckSchema = z
  .object({
    canDelete: z.boolean(),
    dependencies: ContactDependencySchema.array(),
    message: z.string(),
    totalDependencies: z.number().int().nonnegative(),
  })
  .openapi({
    title: 'ContactDependencyCheck',
    description: 'Result of dependency analysis for a contact deletion request',
  });

export const ContactDeletionPreviewSchema = z
  .object({
    contact: BaseContactSchema,
    dependencyCheck: ContactDependencyCheckSchema,
  })
  .openapi({
    title: 'ContactDeletionPreview',
    description: 'Preview information returned when requesting a deletion dependency check',
  });

export const ContactDeletionSummarySchema = z
  .object({
    deletedContact: BaseContactSchema,
    dependenciesDeleted: z.number().int().nonnegative(),
    wasForced: z.boolean(),
    message: z.string().optional(),
  })
  .openapi({
    title: 'ContactDeletionSummary',
    description: 'Summary returned after a contact has been deleted',
  });

export const ContactDeletionResponseSchema = z
  .union([ContactDeletionPreviewSchema, ContactDeletionSummarySchema])
  .openapi({
    title: 'ContactDeletionResponse',
    description: 'Response returned from the contact deletion endpoint',
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
});

export const ContactValidationWithSignInSchema = ContactValidationSchema.safeExtend(
  SignInCredentialsSchema.shape,
);

export const RegisteredUserSchema = z.object({
  id: z.string(),
  userName: SignInUserNameSchema,
  token: z.string().optional(),
  contact: BaseContactSchema.optional(),
});

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
export type TeamWithNameType = z.infer<typeof TeamWithNameSchema>;
export type TeamManagerWithTeamsType = z.infer<typeof TeamManagerWithTeams>;
export type AutomaticRoleHoldersType = z.infer<typeof AutomaticRoleHoldersSchema>;
export type ContactDeletionQueryType = z.infer<typeof ContactDeletionQuerySchema>;
export type ContactDependencyType = z.infer<typeof ContactDependencySchema>;
export type ContactDependencyCheckType = z.infer<typeof ContactDependencyCheckSchema>;
export type ContactDeletionPreviewType = z.infer<typeof ContactDeletionPreviewSchema>;
export type ContactDeletionSummaryType = z.infer<typeof ContactDeletionSummarySchema>;
export type ContactDeletionResponseType = z.infer<typeof ContactDeletionResponseSchema>;
export type ContactValidationType = z.infer<typeof ContactValidationSchema>;
export type ContactValidationWithSignInType = z.infer<typeof ContactValidationWithSignInSchema>;
export type SignInUserNameType = z.infer<typeof SignInUserNameSchema>;
export type SignInCredentialsType = z.infer<typeof SignInCredentialsSchema>;
export type RegisteredUserType = z.infer<typeof RegisteredUserSchema>;
