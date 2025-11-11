import { Prisma } from '@prisma/client';
import {
  dbDiscordMessagePreview,
  dbSocialFeedItem,
  dbSocialVideo,
} from '../repositories/types/dbTypes.js';
import {
  CommunityMessageAttachment,
  CommunityMessagePreviewResponse,
  SocialFeedItemMetadata,
  SocialFeedItemResponse,
  SocialMediaAttachment,
  SocialVideoResponse,
} from '../types/social.js';

export class SocialFeedResponseFormatter {
  static formatFeedItems(records: dbSocialFeedItem[]): SocialFeedItemResponse[] {
    return records.map((record) => ({
      id: record.id,
      accountId: record.accountid.toString(),
      seasonId: record.seasonid.toString(),
      teamId: record.teamid?.toString() ?? null,
      teamSeasonId: record.teamseasonid?.toString() ?? null,
      source: record.source as SocialFeedItemResponse['source'],
      channelName: record.channelname,
      authorName: record.authorname,
      authorHandle: record.authorhandle,
      content: record.content,
      media: this.parseAttachments(record.media),
      postedAt: record.postedat.toISOString(),
      permalink: record.permalink,
      metadata: this.parseMetadata(record.metadata),
    }));
  }

  static formatVideos(records: dbSocialVideo[]): SocialVideoResponse[] {
    return records.map((record) => ({
      id: record.id,
      accountId: record.accountid.toString(),
      seasonId: record.seasonid.toString(),
      teamId: record.teamid?.toString() ?? null,
      teamSeasonId: record.teamseasonid?.toString() ?? null,
      source: record.source as SocialVideoResponse['source'],
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
  ): CommunityMessagePreviewResponse[] {
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
      postedAt: record.postedat.toISOString(),
      permalink: record.permalink,
    }));
  }

  private static parseAttachments(
    media: Prisma.JsonValue | null,
  ): SocialMediaAttachment[] | undefined {
    if (!media || !Array.isArray(media)) {
      return undefined;
    }

    const attachments: SocialMediaAttachment[] = [];

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
        type: typed.type as SocialMediaAttachment['type'],
        url: typed.url as string,
        thumbnailUrl: typeof typed.thumbnailUrl === 'string' ? typed.thumbnailUrl : null,
      });
    }

    return attachments.length ? attachments : undefined;
  }

  private static parseCommunityAttachments(
    payload: Prisma.JsonValue | null,
  ): CommunityMessageAttachment[] | undefined {
    if (!payload || !Array.isArray(payload)) {
      return undefined;
    }

    const attachments: CommunityMessageAttachment[] = [];

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
        type: typed.type as CommunityMessageAttachment['type'],
        url: typed.url as string,
        thumbnailUrl: typeof typed.thumbnailUrl === 'string' ? typed.thumbnailUrl : null,
      });
    }

    return attachments.length ? attachments : undefined;
  }

  private static parseMetadata(
    metadata: Prisma.JsonValue | null,
  ): SocialFeedItemMetadata | undefined {
    if (!metadata || typeof metadata !== 'object' || metadata === null) {
      return undefined;
    }

    const data = metadata as Record<string, unknown>;
    const parsed: SocialFeedItemMetadata = {};

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
}
