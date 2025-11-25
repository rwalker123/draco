import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema, trimToUndefined } from './standardSchema.js';
import { isoDateTimeSchema } from './date.js';
import { booleanQueryParam, numberQueryParam } from './queryParams.js';
import { DiscordChannelScopeEnum } from './accountDiscord.js';

extendZodWithOpenApi(z);

const optionalBigintStringSchema = z
  .preprocess((value) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return String(value).trim();
  }, bigintToStringSchema)
  .optional();

const coerceStringArray = <T extends z.ZodArray<z.ZodTypeAny>>(schema: T): z.ZodOptional<T> =>
  z
    .preprocess((value) => {
      if (value === undefined || value === null || value === '') {
        return undefined;
      }

      if (Array.isArray(value)) {
        return value.map((item) => String(item));
      }

      if (typeof value === 'string') {
        return value
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean);
      }

      return value;
    }, schema as z.ZodArray<z.ZodTypeAny>)
    .optional() as unknown as z.ZodOptional<T>;

export const SocialSourceSchema = z
  .enum([
    'twitter',
    'bluesky',
    'facebook',
    'instagram',
    'tiktok',
    'youtube',
    'twitch',
    'discord-global',
    'discord-team',
    'custom',
  ])
  .openapi({
    title: 'SocialSource',
    description: 'Originating platform for a social feed item.',
  });

export const SocialMediaAttachmentSchema = z
  .object({
    type: z.enum(['image', 'video', 'audio', 'file', 'lottie']).openapi({
      description: 'Attachment media type.',
      example: 'image',
    }),
    url: z.string().url().openapi({ example: 'https://cdn.example.com/media.jpg' }),
    thumbnailUrl: z.string().url().nullable().optional(),
    metadata: z
      .object({
        lottieJson: z.string().optional(),
      })
      .optional(),
  })
  .openapi({
    title: 'SocialMediaAttachment',
  });

export const SocialFeedItemMetadataSchema = z
  .object({
    reactions: z.number().int().nonnegative().optional(),
    replies: z.number().int().nonnegative().optional(),
    viewCount: z.number().int().nonnegative().optional(),
  })
  .openapi({
    title: 'SocialFeedItemMetadata',
  });

export const SocialFeedItemSchema = z
  .object({
    id: z.string().trim().min(1).openapi({ description: 'Stable identifier for the post.' }),
    accountId: bigintToStringSchema,
    seasonId: bigintToStringSchema,
    teamId: bigintToStringSchema.nullable().optional(),
    teamSeasonId: bigintToStringSchema.nullable().optional(),
    source: SocialSourceSchema,
    channelName: z.string().trim().min(1),
    authorName: z.string().trim().nullable().optional(),
    authorHandle: z.string().trim().nullable().optional(),
    content: z.string().trim(),
    media: SocialMediaAttachmentSchema.array().optional(),
    postedAt: isoDateTimeSchema,
    permalink: z.string().trim().url().nullable().optional(),
    deletedAt: isoDateTimeSchema.nullable().optional(),
    metadata: SocialFeedItemMetadataSchema.optional(),
  })
  .openapi({
    title: 'SocialFeedItem',
    description: 'Normalized social media post content.',
  });

export const SocialFeedListSchema = z
  .object({
    feed: SocialFeedItemSchema.array(),
  })
  .openapi({
    title: 'SocialFeedList',
  });

const socialSourceListSchema = coerceStringArray(SocialSourceSchema.array().min(1));

export const SocialFeedQuerySchema = z
  .object({
    teamId: optionalBigintStringSchema,
    teamSeasonId: optionalBigintStringSchema,
    sources: socialSourceListSchema,
    includeDeleted: booleanQueryParam.optional().default(false),
    before: z
      .preprocess(trimToUndefined, isoDateTimeSchema)
      .optional()
      .openapi({ description: 'Only return posts created before this timestamp.' }),
    limit: numberQueryParam({ min: 1, max: 200 }).default(50),
  })
  .openapi({
    title: 'SocialFeedQuery',
  });

export const SocialVideoSchema = z
  .object({
    id: z.string().trim().min(1),
    accountId: bigintToStringSchema,
    teamId: bigintToStringSchema.nullable().optional(),
    source: SocialSourceSchema,
    title: z.string().trim().min(1),
    description: z.string().trim().nullable().optional(),
    durationSeconds: z.number().int().nonnegative().nullable().optional(),
    thumbnailUrl: z.string().url(),
    videoUrl: z.string().url(),
    isLive: z.boolean(),
    publishedAt: isoDateTimeSchema,
  })
  .openapi({
    title: 'SocialVideo',
  });

export const SocialVideoListSchema = z
  .object({
    videos: SocialVideoSchema.array(),
  })
  .openapi({ title: 'SocialVideoList' });

export const SocialVideoQuerySchema = z
  .object({
    teamId: optionalBigintStringSchema,
    liveOnly: booleanQueryParam.optional(),
    accountOnly: booleanQueryParam.optional(),
    limit: numberQueryParam({ min: 1, max: 100 }).default(20),
  })
  .openapi({
    title: 'SocialVideoQuery',
  });

const DiscordRichContentTextNodeSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

const DiscordRichContentEmojiNodeSchema = z.object({
  type: z.literal('emoji'),
  id: z.string().optional(),
  name: z.string(),
  url: z.string().url(),
  animated: z.boolean().optional(),
});

const DiscordRichContentMentionNodeSchema = z.object({
  type: z.literal('mention'),
  id: z.string(),
  mentionType: z.enum(['user', 'channel', 'role']),
  label: z.string().optional(),
  raw: z.string().optional(),
});

export const DiscordRichContentNodeSchema = z.discriminatedUnion('type', [
  DiscordRichContentTextNodeSchema,
  DiscordRichContentEmojiNodeSchema,
  DiscordRichContentMentionNodeSchema,
]);

export const CommunityMessageAttachmentSchema = SocialMediaAttachmentSchema.openapi({
  title: 'CommunityMessageAttachment',
});

export const CommunityMessagePreviewSchema = z
  .object({
    id: z.string().trim().min(1),
    accountId: bigintToStringSchema,
    seasonId: bigintToStringSchema,
    teamId: bigintToStringSchema.nullable().optional(),
    teamSeasonId: bigintToStringSchema.nullable().optional(),
    channelId: z.string().trim().min(1),
    channelName: z.string().trim().min(1),
    authorId: z.string().trim().min(1),
    authorDisplayName: z.string().trim().min(1),
    avatarUrl: z.string().url().nullable().optional(),
    content: z.string().trim(),
    attachments: CommunityMessageAttachmentSchema.array().optional(),
    richContent: DiscordRichContentNodeSchema.array().optional(),
    postedAt: isoDateTimeSchema,
    permalink: z.string().trim().url().nullable().optional(),
  })
  .openapi({
    title: 'CommunityMessagePreview',
  });

export const CommunityMessageListSchema = z
  .object({
    messages: CommunityMessagePreviewSchema.array(),
  })
  .openapi({
    title: 'CommunityMessageList',
  });

export const CommunityMessageQuerySchema = z
  .object({
    teamSeasonId: optionalBigintStringSchema,
    channelIds: coerceStringArray(z.array(z.string().trim().min(1))),
    limit: numberQueryParam({ min: 1, max: 200 }).default(50),
  })
  .openapi({
    title: 'CommunityMessageQuery',
  });

export const CommunityChannelSchema = z
  .object({
    id: z.string().trim().min(1),
    accountId: bigintToStringSchema,
    seasonId: bigintToStringSchema,
    discordChannelId: z.string().trim().min(1),
    name: z.string().trim().min(1),
    label: z.string().trim().nullable().optional(),
    scope: DiscordChannelScopeEnum,
    channelType: z.string().trim().nullable().optional(),
    url: z.string().url().nullable().optional(),
    teamId: optionalBigintStringSchema,
    teamSeasonId: optionalBigintStringSchema,
  })
  .openapi({
    title: 'CommunityChannel',
  });

export const CommunityChannelListSchema = z
  .object({
    channels: CommunityChannelSchema.array(),
  })
  .openapi({
    title: 'CommunityChannelList',
  });

export const CommunityChannelQuerySchema = z
  .object({
    teamSeasonId: optionalBigintStringSchema.optional(),
  })
  .openapi({
    title: 'CommunityChannelQuery',
  });

export const LiveEventStatusSchema = z
  .enum(['upcoming', 'live', 'ended', 'cancelled'])
  .openapi({ title: 'LiveEventStatus' });

export const LiveEventSchema = z
  .object({
    id: bigintToStringSchema,
    leagueEventId: bigintToStringSchema,
    accountId: bigintToStringSchema,
    seasonId: bigintToStringSchema,
    leagueSeasonId: bigintToStringSchema,
    teamSeasonId: bigintToStringSchema.nullable().optional(),
    teamId: bigintToStringSchema.nullable().optional(),
    startsAt: isoDateTimeSchema,
    title: z.string().trim().min(1),
    description: z.string().trim().nullable().optional(),
    streamPlatform: z.string().trim().nullable().optional(),
    streamUrl: z.string().trim().url().nullable().optional(),
    discordChannelId: z.string().trim().nullable().optional(),
    location: z.string().trim().nullable().optional(),
    status: LiveEventStatusSchema,
    featured: z.boolean(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .openapi({
    title: 'LiveEvent',
  });

export const LiveEventListSchema = z
  .object({
    events: LiveEventSchema.array(),
  })
  .openapi({
    title: 'LiveEventList',
  });

export const LiveEventQuerySchema = z
  .object({
    teamSeasonId: optionalBigintStringSchema,
    status: coerceStringArray(LiveEventStatusSchema.array().min(1)),
    featuredOnly: booleanQueryParam.optional(),
  })
  .openapi({
    title: 'LiveEventQuery',
  });

const LiveEventBaseMutationSchema = z.object({
  leagueEventId: optionalBigintStringSchema,
  leagueSeasonId: optionalBigintStringSchema,
  teamSeasonId: optionalBigintStringSchema,
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(255).optional(),
  streamPlatform: z.string().trim().max(50).optional(),
  streamUrl: z.string().trim().url().optional(),
  discordChannelId: z.string().trim().max(32).optional(),
  location: z.string().trim().max(255).optional(),
  status: LiveEventStatusSchema.optional(),
  featured: z.boolean().optional(),
  startsAt: isoDateTimeSchema.optional(),
});

export const LiveEventCreateSchema = LiveEventBaseMutationSchema.extend({
  title: z.string().trim().min(1).max(120),
})
  .superRefine((data, ctx) => {
    if (!data.leagueEventId && !data.leagueSeasonId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'leagueSeasonId is required when leagueEventId is not provided',
        path: ['leagueSeasonId'],
      });
    }

    if (!data.leagueEventId && !data.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'startsAt is required when leagueEventId is not provided',
        path: ['startsAt'],
      });
    }
  })
  .openapi({
    title: 'LiveEventCreate',
  });

export const LiveEventUpdateSchema = LiveEventBaseMutationSchema.openapi({
  title: 'LiveEventUpdate',
});

export type SocialSourceType = z.infer<typeof SocialSourceSchema>;
export type SocialMediaAttachmentType = z.infer<typeof SocialMediaAttachmentSchema>;
export type SocialFeedItemMetadataType = z.infer<typeof SocialFeedItemMetadataSchema>;
export type SocialFeedItemType = z.infer<typeof SocialFeedItemSchema>;
export type SocialFeedListType = z.infer<typeof SocialFeedListSchema>;
export type SocialFeedQueryType = z.infer<typeof SocialFeedQuerySchema>;
export type SocialVideoType = z.infer<typeof SocialVideoSchema>;
export type SocialVideoListType = z.infer<typeof SocialVideoListSchema>;
export type SocialVideoQueryType = z.infer<typeof SocialVideoQuerySchema>;
export type CommunityMessageAttachmentType = z.infer<typeof CommunityMessageAttachmentSchema>;
export type CommunityMessagePreviewType = z.infer<typeof CommunityMessagePreviewSchema>;
export type CommunityMessageListType = z.infer<typeof CommunityMessageListSchema>;
export type CommunityMessageQueryType = z.infer<typeof CommunityMessageQuerySchema>;
export type CommunityChannelType = z.infer<typeof CommunityChannelSchema>;
export type CommunityChannelListType = z.infer<typeof CommunityChannelListSchema>;
export type CommunityChannelQueryType = z.infer<typeof CommunityChannelQuerySchema>;
export type DiscordRichContentNodeType = z.infer<typeof DiscordRichContentNodeSchema>;
export type LiveEventStatusType = z.infer<typeof LiveEventStatusSchema>;
export type LiveEventType = z.infer<typeof LiveEventSchema>;
export type LiveEventListType = z.infer<typeof LiveEventListSchema>;
export type LiveEventQueryType = z.infer<typeof LiveEventQuerySchema>;
export type LiveEventCreateType = z.infer<typeof LiveEventCreateSchema>;
export type LiveEventUpdateType = z.infer<typeof LiveEventUpdateSchema>;
