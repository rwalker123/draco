import { z } from 'zod';
import { CreateContactSchema, NamedContactSchema, RegisteredUserSchema } from './contact.js';

const queryValueSchema = z
  .string()
  .trim()
  .min(1, { message: 'Search query is required' })
  .max(100, { message: 'Search query must be 100 characters or fewer' });

export const AccountSearchQueryParamSchema = queryValueSchema;

export const AccountSearchQuerySchema = z.object({
  q: z.preprocess((value) => {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }, queryValueSchema),
});

export type AccountSearchQueryType = z.infer<typeof AccountSearchQuerySchema>;

export const AccountDomainLookupHeadersSchema = z.object({
  host: z.string().trim().min(1, { message: 'Host header is required' }),
});

export type AccountDomainLookupHeadersType = z.infer<typeof AccountDomainLookupHeadersSchema>;

const includeCurrentSeasonPreprocessor = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return undefined;
}, z.boolean().optional());

export const AccountDetailsQuerySchema = z.object({
  includeCurrentSeason: includeCurrentSeasonPreprocessor.optional().default(false),
});

export const AccountTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const accountUrlValueSchema = z
  .string()
  .trim()
  .min(1, { message: 'URL is required' })
  .refine(
    (value) => {
      try {
        const parsedUrl = new URL(value);
        return (
          (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') &&
          !!parsedUrl.hostname
        );
      } catch (_error) {
        return false;
      }
    },
    { message: 'Invalid URL format. Please use http:// or https:// followed by a valid domain.' },
  )
  .transform((value) => value.toLowerCase());

export const AccountUrlSchema = z.object({
  id: z.string(),
  url: accountUrlValueSchema,
});

export const CreateAccountUrlSchema = z.object({
  id: z.string().optional(),
  url: accountUrlValueSchema,
});

export const AccountAffiliationSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().nullable().optional(),
});

export const AccountSocialsSchema = z.object({
  twitterAccountName: z.string().optional(),
  blueskyHandle: z.string().optional(),
  twitterConnected: z.boolean().default(false),
  instagramHandle: z.string().optional(),
  instagramConnected: z.boolean().default(false),
  facebookFanPage: z.string().optional(),
  youtubeUserId: z.string().nullable().optional(),
  defaultVideo: z.string().nullable().optional(),
  autoPlayVideo: z.boolean().default(false),
});

export const AccountDiscordIntegrationSchema = z.object({
  guildId: z.string().trim().nullable(),
  guildName: z.string().trim().nullable().optional(),
});

export const AccountTwitterSettingsSchema = z.object({
  twitterAccountName: z.string().trim().optional(),
  twitterClientId: z.string().trim().optional(),
  twitterClientSecret: z.string().trim().optional(),
  twitterIngestionBearerToken: z.string().trim().optional(),
});

export const AccountTwitterOAuthStartSchema = z.object({
  returnUrl: z.string().trim().url().optional(),
});

export const AccountTwitterAuthorizationUrlSchema = z.object({
  authorizationUrl: z.string().trim().url(),
});

export const AccountBlueskySettingsSchema = z.object({
  blueskyHandle: z.string().trim().optional(),
  blueskyAppPassword: z.string().trim().optional(),
});

export const AccountConfigurationSchema = z.object({
  accountType: AccountTypeSchema.optional(),
  firstYear: z.number().int().nullable().optional(),
  timeZone: z.string().nullable().optional(),
  affiliation: AccountAffiliationSchema.nullable().optional(),
});

export const AccountNameSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const AccountHeaderSchema = AccountNameSchema.extend({
  accountLogoUrl: z.string(),
});

export const AccountSchema = AccountHeaderSchema.extend({
  configuration: AccountConfigurationSchema.optional(),
  urls: z.array(AccountUrlSchema).default([]),
  accountOwner: z
    .object({
      user: RegisteredUserSchema.optional(),
      contact: NamedContactSchema.optional(),
    })
    .optional(),
  socials: AccountSocialsSchema.optional(),
  discordIntegration: AccountDiscordIntegrationSchema.optional(),
});

export const AccountCurrentSeasonSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const AccountSeasonWithStatusSchema = AccountCurrentSeasonSchema.extend({
  isCurrent: z.boolean(),
});

export const CreateAccountSchema = AccountSchema.omit({
  id: true,
  accountOwner: true,
}).extend({
  urls: z.array(CreateAccountUrlSchema).default([]),
  ownerContact: CreateContactSchema.omit({ photo: true }).optional(), // schema optional but create backend will fail if not speicfied.
  seasonName: z.string().max(25).default(''),
});

export const AccountWithSeasonsSchema = z.object({
  account: AccountSchema,
  currentSeason: AccountCurrentSeasonSchema.nullable(),
  seasons: z.array(AccountSeasonWithStatusSchema),
});

export type AccountType = z.infer<typeof AccountSchema>;
export type AccountConfigurationType = z.infer<typeof AccountConfigurationSchema>;
export type AccountSocialsType = z.infer<typeof AccountSocialsSchema>;
export type AccountDiscordIntegrationType = z.infer<typeof AccountDiscordIntegrationSchema>;
export type AccountAffiliationType = z.infer<typeof AccountAffiliationSchema>;
export type AccountUrlType = z.infer<typeof AccountUrlSchema>;
export type CreateAccountUrlType = z.infer<typeof CreateAccountUrlSchema>;
export type AccountTwitterSettingsType = z.infer<typeof AccountTwitterSettingsSchema>;
export type AccountBlueskySettingsType = z.infer<typeof AccountBlueskySettingsSchema>;
export type AccountTypeReference = z.infer<typeof AccountTypeSchema>;
export type AccountSearchQueryParamType = z.infer<typeof AccountSearchQueryParamSchema>;
export type CreateAccountType = z.infer<typeof CreateAccountSchema>;
export type AccountWithSeasonsType = z.infer<typeof AccountWithSeasonsSchema>;
export type AccountSeasonWithStatusType = z.infer<typeof AccountSeasonWithStatusSchema>;
export type AccountCurrentSeasonType = z.infer<typeof AccountCurrentSeasonSchema>;
export type AccountDetailsQueryType = z.infer<typeof AccountDetailsQuerySchema>;
export type AccountNameType = z.infer<typeof AccountNameSchema>;
export type AccountHeaderType = z.infer<typeof AccountHeaderSchema>;
