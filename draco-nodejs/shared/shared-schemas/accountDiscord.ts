import { z } from 'zod';
import { isoDateTimeSchema } from './date.js';
import { bigintToStringSchema } from './standardSchema.js';

export const DiscordGuildIdSchema = z
  .string()
  .trim()
  .min(1, 'Discord guild id is required')
  .max(32, 'Discord guild id cannot exceed 32 characters')
  .regex(/^\d+$/, 'Discord guild id must be numeric');

export const DiscordChannelIdSchema = z
  .string()
  .trim()
  .min(1, 'Discord channel id is required')
  .max(32, 'Discord channel id cannot exceed 32 characters')
  .regex(/^\d+$/, 'Discord channel id must be numeric');

export const DiscordRoleIdSchema = z
  .string()
  .trim()
  .min(1, 'Discord role id is required')
  .max(32, 'Discord role id cannot exceed 32 characters')
  .regex(/^\d+$/, 'Discord role id must be numeric');

export const DiscordAccountConfigSchema = z.object({
  id: bigintToStringSchema,
  accountId: bigintToStringSchema,
  guildId: DiscordGuildIdSchema.nullable(),
  guildName: z.string().nullable(),
  botUserId: z.string().nullable(),
  botUserName: z.string().nullable(),
  roleSyncEnabled: z.boolean(),
  botTokenConfigured: z.boolean(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type DiscordAccountConfigType = z.infer<typeof DiscordAccountConfigSchema>;

export const DiscordAccountConfigUpdateSchema = z.object({
  guildId: DiscordGuildIdSchema.nullable(),
  roleSyncEnabled: z.boolean().optional(),
  botToken: z
    .string()
    .trim()
    .min(1, 'Bot token is required')
    .max(256, 'Bot token cannot exceed 256 characters')
    .optional(),
});

export type DiscordAccountConfigUpdateType = z.infer<typeof DiscordAccountConfigUpdateSchema>;

export const DiscordRoleMappingSchema = z.object({
  id: bigintToStringSchema,
  accountId: bigintToStringSchema,
  discordRoleId: DiscordRoleIdSchema,
  discordRoleName: z.string(),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type DiscordRoleMappingType = z.infer<typeof DiscordRoleMappingSchema>;

export const DiscordRoleMappingUpdateSchema = z.object({
  discordRoleId: DiscordRoleIdSchema,
  discordRoleName: z.string().trim().min(1),
  permissions: z.array(z.string()).min(1),
});

export type DiscordRoleMappingUpdateType = z.infer<typeof DiscordRoleMappingUpdateSchema>;

export const DiscordLinkStatusSchema = z.object({
  linked: z.boolean(),
  username: z.string().nullable(),
  discriminator: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  guildMember: z.boolean().optional(),
  lastSyncedAt: isoDateTimeSchema.nullable().optional(),
});

export type DiscordLinkStatusType = z.infer<typeof DiscordLinkStatusSchema>;

export const DiscordOAuthStartResponseSchema = z.object({
  authorizationUrl: z.string().url(),
  expiresAt: isoDateTimeSchema,
});

export type DiscordOAuthStartResponseType = z.infer<typeof DiscordOAuthStartResponseSchema>;
