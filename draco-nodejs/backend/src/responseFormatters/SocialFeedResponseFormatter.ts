import { Prisma } from '@prisma/client';
import {
  dbDiscordMessagePreview,
  dbSocialFeedItem,
  dbSocialVideo,
} from '../repositories/types/dbTypes.js';
import {
  CommunityMessageAttachmentType,
  CommunityMessagePreviewType,
  DiscordRichContentNodeType,
  SocialFeedItemMetadataType,
  SocialFeedItemType,
  SocialMediaAttachmentType,
  SocialVideoType,
} from '@draco/shared-schemas';

export class SocialFeedResponseFormatter {
  static formatFeedItems(records: dbSocialFeedItem[]): SocialFeedItemType[] {
    return records.map((record) => ({
      id: record.id,
      accountId: record.accountid.toString(),
      seasonId: record.seasonid.toString(),
      teamId: record.teamid?.toString() ?? null,
      teamSeasonId: record.teamseasonid?.toString() ?? null,
      source: record.source as SocialFeedItemType['source'],
      channelName: record.channelname,
      authorName: record.authorname,
      authorHandle: record.authorhandle,
      content: record.content,
      media: this.parseAttachments(record.media),
      postedAt: record.postedat.toISOString(),
      permalink: record.permalink ?? null,
      metadata: this.parseMetadata(record.metadata),
    }));
  }

  static formatVideos(records: dbSocialVideo[]): SocialVideoType[] {
    return records.map((record) => ({
      id: record.id,
      accountId: record.accountid.toString(),
      seasonId: record.seasonid.toString(),
      teamId: record.teamid?.toString() ?? null,
      teamSeasonId: record.teamseasonid?.toString() ?? null,
      source: record.source as SocialVideoType['source'],
      title: record.title,
      description: record.description,
      durationSeconds: record.durationseconds ?? undefined,
      thumbnailUrl: record.thumbnailurl,
      videoUrl: record.videourl,
      isLive: record.islive,
      publishedAt: record.publishedat.toISOString(),
    }));
  }

  static formatCommunityMessages(
    records: dbDiscordMessagePreview[],
  ): CommunityMessagePreviewType[] {
    return records.map((record) => ({
      id: record.id,
      accountId: record.accountid.toString(),
      seasonId: record.seasonid.toString(),
      teamId: record.teamid?.toString() ?? null,
      teamSeasonId: record.teamseasonid?.toString() ?? null,
      channelId: record.channelid,
      channelName: record.channelname,
      authorId: record.authorid,
      authorDisplayName: record.authorname,
      avatarUrl: record.avatarurl,
      content: record.content,
      attachments: this.parseCommunityAttachments(record.attachments),
      richContent: this.parseRichContent(record.richcontent),
      postedAt: record.postedat.toISOString(),
      permalink: record.permalink ?? null,
    }));
  }

  private static parseAttachments(
    media: Prisma.JsonValue | null,
  ): SocialMediaAttachmentType[] | undefined {
    if (!media || !Array.isArray(media)) {
      return undefined;
    }

    const attachments: SocialMediaAttachmentType[] = [];

    for (const item of media) {
      if (
        typeof item !== 'object' ||
        item === null ||
        typeof (item as Record<string, unknown>).type !== 'string' ||
        typeof (item as Record<string, unknown>).url !== 'string'
      ) {
        continue;
      }

      const typed = item as Record<string, unknown>;
      attachments.push({
        type: typed.type as SocialMediaAttachmentType['type'],
        url: typed.url as string,
        thumbnailUrl: typeof typed.thumbnailUrl === 'string' ? typed.thumbnailUrl : null,
      });
    }

    return attachments.length ? attachments : undefined;
  }

  private static parseCommunityAttachments(
    payload: Prisma.JsonValue | null,
  ): CommunityMessageAttachmentType[] | undefined {
    if (!payload || !Array.isArray(payload)) {
      return undefined;
    }

    const attachments: CommunityMessageAttachmentType[] = [];

    for (const item of payload) {
      if (
        typeof item !== 'object' ||
        item === null ||
        typeof (item as Record<string, unknown>).type !== 'string' ||
        typeof (item as Record<string, unknown>).url !== 'string'
      ) {
        continue;
      }

      const typed = item as Record<string, unknown>;
      attachments.push({
        type: typed.type as CommunityMessageAttachmentType['type'],
        url: typed.url as string,
        thumbnailUrl: typeof typed.thumbnailUrl === 'string' ? typed.thumbnailUrl : null,
      });
    }

    return attachments.length ? attachments : undefined;
  }

  private static parseMetadata(
    metadata: Prisma.JsonValue | null,
  ): SocialFeedItemMetadataType | undefined {
    if (
      metadata === null ||
      typeof metadata !== 'object' ||
      Array.isArray(metadata) ||
      metadata instanceof Date ||
      metadata instanceof RegExp
    ) {
      return undefined;
    }

    const data = metadata as Record<string, unknown>;
    const parsed: SocialFeedItemMetadataType = {};

    if (typeof data.reactions === 'number') {
      parsed.reactions = data.reactions;
    }
    if (typeof data.replies === 'number') {
      parsed.replies = data.replies;
    }
    if (typeof data.viewCount === 'number') {
      parsed.viewCount = data.viewCount;
    }

    return Object.keys(parsed).length ? parsed : undefined;
  }

  private static parseRichContent(
    payload: Prisma.JsonValue | null,
  ): DiscordRichContentNodeType[] | undefined {
    if (!payload || !Array.isArray(payload)) {
      return undefined;
    }

    const nodes: DiscordRichContentNodeType[] = [];

    for (const item of payload) {
      if (typeof item !== 'object' || item === null) {
        continue;
      }

      const record = item as Record<string, unknown>;
      const type = record.type;

      if (type === 'text' && typeof record.text === 'string') {
        nodes.push({ type: 'text', text: record.text });
        continue;
      }

      if (
        type === 'emoji' &&
        typeof record.name === 'string' &&
        typeof record.url === 'string'
      ) {
        const node: DiscordRichContentNodeType = {
          type: 'emoji',
          name: record.name,
          url: record.url,
        };

        if (typeof record.id === 'string') {
          node.id = record.id;
        }
        if (typeof record.animated === 'boolean') {
          node.animated = record.animated;
        }

        nodes.push(node);
        continue;
      }

      if (type === 'mention' && typeof record.id === 'string' && typeof record.mentionType === 'string') {
        const mentionType = record.mentionType;
        if (mentionType === 'user' || mentionType === 'channel' || mentionType === 'role') {
          const node: DiscordRichContentNodeType = {
            type: 'mention',
            id: record.id,
            mentionType,
          };

          if (typeof record.label === 'string') {
            node.label = record.label;
          }
          if (typeof record.raw === 'string') {
            node.raw = record.raw;
          }

          nodes.push(node);
        }
      }
    }

    return nodes.length ? nodes : undefined;
  }
}
