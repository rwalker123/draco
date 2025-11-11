export type SocialSource =
  | 'twitter'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'twitch'
  | 'discord-global'
  | 'discord-team'
  | 'custom';

export interface SocialMediaAttachment {
  type: 'image' | 'video' | 'file';
  url: string;
  thumbnailUrl?: string | null;
}

export interface SocialFeedItemMetadata {
  reactions?: number;
  replies?: number;
  viewCount?: number;
}

export interface SocialFeedItemResponse {
  id: string;
  accountId: string;
  seasonId: string;
  teamId?: string | null;
  teamSeasonId?: string | null;
  source: SocialSource;
  channelName: string;
  authorName?: string | null;
  authorHandle?: string | null;
  content: string;
  media?: SocialMediaAttachment[];
  postedAt: string;
  permalink?: string | null;
  metadata?: SocialFeedItemMetadata;
}

export interface SocialVideoResponse {
  id: string;
  accountId: string;
  seasonId: string;
  teamId?: string | null;
  teamSeasonId?: string | null;
  source: 'youtube' | 'twitch' | 'facebook' | 'custom';
  title: string;
  description?: string | null;
  durationSeconds?: number | null;
  thumbnailUrl: string;
  videoUrl: string;
  isLive: boolean;
  publishedAt: string;
}

export interface CommunityMessageAttachment {
  type: 'image' | 'video' | 'file';
  url: string;
  thumbnailUrl?: string | null;
}

export interface CommunityMessagePreviewResponse {
  id: string;
  accountId: string;
  seasonId: string;
  teamId?: string | null;
  teamSeasonId?: string | null;
  channelId: string;
  channelName: string;
  authorId: string;
  authorDisplayName: string;
  avatarUrl?: string | null;
  content: string;
  attachments?: CommunityMessageAttachment[];
  postedAt: string;
  permalink: string;
}

export type LiveEventStatus = 'upcoming' | 'live' | 'ended' | 'cancelled';

export interface LiveEventResponse {
  id: string;
  leagueEventId: string;
  accountId: string;
  seasonId: string;
  leagueSeasonId: string;
  teamSeasonId?: string | null;
  startsAt: string;
  title: string;
  description?: string | null;
  streamPlatform?: string | null;
  streamUrl?: string | null;
  discordChannelId?: string | null;
  location?: string | null;
  status: LiveEventStatus;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SocialFeedFilters {
  teamSeasonId?: bigint;
  teamId?: bigint;
  sources?: SocialSource[];
  before?: Date;
  limit?: number;
}

export interface SocialVideoFilters {
  teamSeasonId?: bigint;
  teamId?: bigint;
  liveOnly?: boolean;
  limit?: number;
}

export interface CommunityMessageFilters {
  teamSeasonId?: bigint;
  channelIds?: string[];
  limit?: number;
}

export interface LiveEventFilters {
  teamSeasonId?: bigint;
  status?: LiveEventStatus[];
  featuredOnly?: boolean;
}

export interface LiveEventUpsertInput {
  leagueSeasonId?: bigint;
  leagueEventId?: bigint;
  teamSeasonId?: bigint;
  startsAt?: Date;
  title: string;
  description?: string;
  streamPlatform?: string;
  streamUrl?: string;
  discordChannelId?: string;
  location?: string;
  status?: LiveEventStatus;
  featured?: boolean;
}
