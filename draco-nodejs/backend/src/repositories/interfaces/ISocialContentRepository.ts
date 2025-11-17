import { Prisma } from '@prisma/client';
import { dbDiscordMessagePreview, dbSocialFeedItem, dbSocialVideo } from '../types/dbTypes.js';

export interface SocialFeedQuery {
  accountId: bigint;
  seasonId: bigint;
  teamId?: bigint;
  teamSeasonId?: bigint;
  sources?: string[];
  before?: Date;
  limit?: number;
}

export interface SocialVideoQuery {
  accountId: bigint;
  seasonId: bigint;
  teamId?: bigint;
  teamSeasonId?: bigint;
  liveOnly?: boolean;
  limit?: number;
}

export interface CommunityMessageQuery {
  accountId: bigint;
  seasonId: bigint;
  teamSeasonId?: bigint;
  channelIds?: string[];
  limit?: number;
}

export interface CommunityMessageCacheEntry {
  id: string;
  content: string;
  attachments?: Prisma.JsonValue | null;
  permalink?: string | null;
  postedAt: Date;
}

export type CreateSocialFeedItemInput = Prisma.socialfeeditemsCreateManyInput;
export type UpsertSocialVideoInput = Prisma.socialvideosUncheckedCreateInput & { id?: string };
export type UpsertCommunityMessageInput = Prisma.discordmessagesUncheckedCreateInput & {
  id: string;
};

export interface ISocialContentRepository {
  listFeedItems(query: SocialFeedQuery): Promise<dbSocialFeedItem[]>;
  createFeedItems(items: CreateSocialFeedItemInput[]): Promise<void>;
  listVideos(query: SocialVideoQuery): Promise<dbSocialVideo[]>;
  upsertVideo(data: UpsertSocialVideoInput): Promise<dbSocialVideo>;
  listCommunityMessages(query: CommunityMessageQuery): Promise<dbDiscordMessagePreview[]>;
  upsertCommunityMessage(data: UpsertCommunityMessageInput): Promise<void>;
  deleteCommunityMessages(ids: string[]): Promise<void>;
  listCommunityMessageCacheEntries(
    accountId: bigint,
    channelId: string,
  ): Promise<CommunityMessageCacheEntry[]>;
}
