import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const NamedContactSchema = z.object({
  id: z.bigint().transform((val) => val.toString()),
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
  streetaddress: z.string().trim().max(100).nullable().default(''),
  city: z.string().trim().max(50).nullable().default(''),
  state: z.string().trim().max(50).nullable().default(''),
  zip: z.string().trim().max(10).nullable().default(''),
  dateofbirth: z.string().trim().nullable().default(''),
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

// Contact roles sub-interface for reusability
export const ContactRoleSchema = z.object({
  id: z.bigint().transform((val) => val.toString()),
  roleId: z.string().trim().max(50),
  roleName: z.string().trim().max(50).optional(),
  roleData: z.bigint().transform((val) => val.toString()),
  contextName: z.string().trim().max(50).optional(),
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
  contact: NamedContactSchema,
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

export type NamedContactType = z.infer<typeof NamedContactSchema>;
export type ContactDetailsType = z.infer<typeof ContactDetailsSchema>;
export type BaseContactType = z.infer<typeof BaseContactSchema>;
export type ContactRoleType = z.infer<typeof ContactRoleSchema>;
export type ContactType = z.infer<typeof ContactSchema>;
export type CreateContactType = z.infer<typeof CreateContactSchema>;
export type RoleWithContactType = z.infer<typeof RoleWithContactSchema>;

// create classes for the types as contact objects are extended in other schemas
export class NamedContact implements NamedContactType {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;

  constructor(data: NamedContactType) {
    this.id = data.id;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.middleName = data.middleName;
  }
}
export class ContactDetails implements ContactDetailsType {
  phone1: string | null;
  phone2: string | null;
  phone3: string | null;
  streetaddress: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  dateofbirth: string | null;

  constructor(data: ContactDetailsType) {
    this.phone1 = data.phone1;
    this.phone2 = data.phone2;
    this.phone3 = data.phone3;
    this.streetaddress = data.streetaddress;
    this.city = data.city;
    this.state = data.state;
    this.zip = data.zip;
    this.dateofbirth = data.dateofbirth;
  }
}

export class BaseContact extends NamedContact implements BaseContactType {
  email?: string;
  userId?: string;
  photoUrl?: string;
  contactDetails?: ContactDetails | undefined;

  constructor(data: BaseContactType) {
    super(data);
    this.email = data.email;
    this.userId = data.userId;
    this.photoUrl = data.photoUrl;
    this.contactDetails = data.contactDetails ? new ContactDetails(data.contactDetails) : undefined;
  }
}

export class ContactRole implements ContactRoleType {
  id: string;
  roleId: string;
  roleName?: string;
  roleData: string;
  contextName?: string;

  constructor(data: ContactRoleType) {
    this.id = data.id;
    this.roleId = data.roleId;
    this.roleName = data.roleName;
    this.roleData = data.roleData;
    this.contextName = data.contextName;
  }
}

export class Contact extends BaseContact implements ContactType {
  contactroles?: ContactRole[] | undefined;
  creatoraccountid?: string;

  constructor(data: ContactType) {
    super(data);
    this.contactroles = data.contactroles
      ? data.contactroles.map((role) => new ContactRole(role))
      : undefined;
    this.creatoraccountid = data.creatoraccountid;
  }
}
