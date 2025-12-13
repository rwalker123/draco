import { z } from 'zod';

export const AccountFacebookOAuthStartSchema = z.object({
  returnUrl: z.string().url().optional(),
});

export type AccountFacebookOAuthStartType = z.infer<typeof AccountFacebookOAuthStartSchema>;

export const FacebookPageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export type FacebookPageType = z.infer<typeof FacebookPageSchema>;

export const FacebookPageSelectionSchema = z.object({
  pageId: z.string().min(1),
  pageName: z.string().min(1),
});

export type FacebookPageSelectionType = z.infer<typeof FacebookPageSelectionSchema>;

export const FacebookPageListSchema = z.array(FacebookPageSchema);

export const FacebookOAuthCallbackQuerySchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export type FacebookOAuthCallbackQueryType = z.infer<typeof FacebookOAuthCallbackQuerySchema>;

export const AccountFacebookCredentialsSchema = z.object({
  appId: z.string().trim().optional(),
  appSecret: z.string().trim().optional(),
  clearCredentials: z.boolean().optional(),
  pageHandle: z.string().trim().min(1).optional(),
});

export type AccountFacebookCredentialsType = z.infer<typeof AccountFacebookCredentialsSchema>;

export const AccountFacebookAuthorizationUrlSchema = z.object({
  authorizationUrl: z.string().url(),
});

export type AccountFacebookAuthorizationUrlType = z.infer<
  typeof AccountFacebookAuthorizationUrlSchema
>;

export const FacebookConnectionStatusSchema = z.object({
  appConfigured: z.boolean(),
  pageConnected: z.boolean(),
  pageId: z.string().nullable().optional(),
  pageName: z.string().nullable().optional(),
  pageHandle: z.string().nullable().optional(),
  userTokenPresent: z.boolean().optional(),
});

export type FacebookConnectionStatusType = z.infer<typeof FacebookConnectionStatusSchema>;
