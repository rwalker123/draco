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
  roleSyncEnabled: z.boolean(),
  teamForumEnabled: z.boolean(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type DiscordAccountConfigType = z.infer<typeof DiscordAccountConfigSchema>;

export const DiscordTeamForumCleanupModeEnum = z.enum(['retain', 'remove']);

export const DiscordAccountConfigUpdateSchema = z
  .object({
    guildId: DiscordGuildIdSchema.nullable().optional(),
    roleSyncEnabled: z.boolean().optional(),
    teamForumEnabled: z.boolean().optional(),
    teamForumCleanupMode: DiscordTeamForumCleanupModeEnum.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.teamForumCleanupMode && value.teamForumEnabled !== false) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['teamForumCleanupMode'],
        message: 'Cleanup mode is only valid when disabling team forums.',
      });
    }
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

export const DiscordRoleMappingListSchema = z.object({
  roleMappings: DiscordRoleMappingSchema.array(),
});

export type DiscordRoleMappingListType = z.infer<typeof DiscordRoleMappingListSchema>;

export const DiscordChannelScopeEnum = z.enum(['account', 'season', 'teamSeason']);

export const DiscordGuildChannelSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  type: z.string().trim().nullable().optional(),
});

export type DiscordGuildChannelType = z.infer<typeof DiscordGuildChannelSchema>;

export const DiscordChannelMappingSchema = z.object({
  id: bigintToStringSchema,
  accountId: bigintToStringSchema,
  discordChannelId: z.string().trim().min(1),
  discordChannelName: z.string().trim().min(1),
  channelType: z.string().nullable().optional(),
  label: z.string().nullable(),
  scope: DiscordChannelScopeEnum,
  seasonId: bigintToStringSchema.nullable(),
  teamSeasonId: bigintToStringSchema.nullable(),
  teamId: bigintToStringSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type DiscordChannelMappingType = z.infer<typeof DiscordChannelMappingSchema>;

export const DiscordChannelMappingListSchema = z.object({
  channels: DiscordChannelMappingSchema.array(),
});

export type DiscordChannelMappingListType = z.infer<typeof DiscordChannelMappingListSchema>;

export const DiscordChannelCreateTypeEnum = z.enum(['text', 'announcement', 'forum']);

const optionalIdSchema = z
  .union([bigintToStringSchema, z.literal('')])
  .transform((value) => (value === '' ? undefined : value));

const ChannelMappingBaseSchema = z.object({
  label: z.string().trim().max(100).optional(),
  scope: DiscordChannelScopeEnum,
  seasonId: optionalIdSchema.optional(),
  teamSeasonId: optionalIdSchema.optional(),
  teamId: optionalIdSchema.optional(),
});

export const DiscordChannelMappingExistingSchema = ChannelMappingBaseSchema.extend({
  mode: z.literal('existing'),
  discordChannelId: z.string().trim().min(1, 'Channel is required'),
  discordChannelName: z.string().trim().min(1, 'Channel name is required'),
  channelType: z.string().trim().optional(),
});

export const DiscordChannelMappingAutoCreateSchema = ChannelMappingBaseSchema.extend({
  mode: z.literal('autoCreate'),
  newChannelName: z.string().trim().min(1, 'Channel name is required').max(100),
  newChannelType: DiscordChannelCreateTypeEnum.default('text'),
});

export const DiscordChannelMappingCreateSchema = z
  .discriminatedUnion('mode', [
    DiscordChannelMappingExistingSchema,
    DiscordChannelMappingAutoCreateSchema,
  ])
  .superRefine((value, ctx) => {
    if (value.scope === 'season' && !value.seasonId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['seasonId'],
        message: 'Season is required when mapping a season channel.',
      });
    }

    if (value.scope === 'teamSeason') {
      if (!value.seasonId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['seasonId'],
          message: 'Season is required when mapping a team channel.',
        });
      }
      if (!value.teamSeasonId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['teamSeasonId'],
          message: 'Team season is required when mapping a team channel.',
        });
      }
    }
  });

export type DiscordChannelMappingCreateType = z.infer<typeof DiscordChannelMappingCreateSchema>;

export const DiscordTeamForumStatusEnum = z.enum(['provisioned', 'needsRepair', 'disabled']);

export const DiscordTeamForumSchema = z.object({
  id: bigintToStringSchema,
  accountId: bigintToStringSchema,
  seasonId: bigintToStringSchema,
  teamSeasonId: bigintToStringSchema,
  teamId: bigintToStringSchema,
  discordChannelId: DiscordChannelIdSchema,
  discordChannelName: z.string().trim().min(1),
  channelType: z.string().trim().nullable().optional(),
  discordRoleId: DiscordRoleIdSchema.nullable(),
  status: DiscordTeamForumStatusEnum,
  autoCreated: z.boolean(),
  lastSyncedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type DiscordTeamForumType = z.infer<typeof DiscordTeamForumSchema>;

export const DiscordTeamForumListSchema = z.object({
  forums: DiscordTeamForumSchema.array(),
});

export type DiscordTeamForumListType = z.infer<typeof DiscordTeamForumListSchema>;

export const DiscordTeamForumQuerySchema = z.object({
  seasonId: optionalIdSchema.optional(),
  teamSeasonId: optionalIdSchema.optional(),
});

export type DiscordTeamForumQueryType = z.infer<typeof DiscordTeamForumQuerySchema>;

export const DiscordTeamForumRepairResultSchema = z.object({
  created: z.number().int().nonnegative(),
  repaired: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  message: z.string(),
});

export type DiscordTeamForumRepairResultType = z.infer<typeof DiscordTeamForumRepairResultSchema>;

export const DiscordLinkStatusSchema = z.object({
  linkingEnabled: z.boolean(),
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

export const DiscordOAuthCallbackSchema = z.object({
  code: z.string().trim().min(1, 'Authorization code is required'),
  state: z.string().trim().min(1, 'OAuth state is required'),
});

export type DiscordOAuthCallbackType = z.infer<typeof DiscordOAuthCallbackSchema>;

export const DiscordFeatureSyncFeatureEnum = z.enum(['announcements']);

export type DiscordFeatureSyncFeatureType = z.infer<typeof DiscordFeatureSyncFeatureEnum>;

export const DiscordFeatureSyncChannelExistingSchema = z.object({
  mode: z.literal('existing'),
  discordChannelId: DiscordChannelIdSchema,
  discordChannelName: z.string().trim().min(1, 'Channel name is required'),
  channelType: z.string().trim().optional(),
});

export const DiscordFeatureSyncChannelAutoCreateSchema = z.object({
  mode: z.literal('autoCreate'),
  newChannelName: z.string().trim().min(1, 'Channel name is required').max(100),
  newChannelType: DiscordChannelCreateTypeEnum.default('text'),
});

export const DiscordFeatureSyncChannelSchema = z.discriminatedUnion('mode', [
  DiscordFeatureSyncChannelExistingSchema,
  DiscordFeatureSyncChannelAutoCreateSchema,
]);

export type DiscordFeatureSyncChannelType = z.infer<typeof DiscordFeatureSyncChannelSchema>;

export const DiscordFeatureSyncUpdateSchema = z
  .object({
    enabled: z.boolean(),
    channel: DiscordFeatureSyncChannelSchema.nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.enabled && !value.channel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['channel'],
        message: 'Channel configuration is required when enabling sync.',
      });
    }
  });

export type DiscordFeatureSyncUpdateType = z.infer<typeof DiscordFeatureSyncUpdateSchema>;

export const DiscordFeatureSyncChannelStatusSchema = z
  .object({
    discordChannelId: DiscordChannelIdSchema,
    discordChannelName: z.string().trim().min(1),
    channelType: z.string().trim().nullable(),
    autoCreated: z.boolean().optional(),
    lastSyncedAt: isoDateTimeSchema.nullable().optional(),
  })
  .partial({ channelType: true, autoCreated: true, lastSyncedAt: true });

export type DiscordFeatureSyncChannelStatusType = z.infer<
  typeof DiscordFeatureSyncChannelStatusSchema
>;

export const DiscordFeatureSyncStatusSchema = z.object({
  feature: DiscordFeatureSyncFeatureEnum,
  enabled: z.boolean(),
  guildConfigured: z.boolean(),
  channel: DiscordFeatureSyncChannelStatusSchema.nullable(),
});

export type DiscordFeatureSyncStatusType = z.infer<typeof DiscordFeatureSyncStatusSchema>;
