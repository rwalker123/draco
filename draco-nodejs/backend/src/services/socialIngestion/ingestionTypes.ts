import {
  SocialFeedItemMetadataType,
  SocialMediaAttachmentType,
  CommunityMessageAttachmentType,
} from '@draco/shared-schemas';
import {
  TwitterIngestionTarget,
  YouTubeIngestionTarget,
  DiscordIngestionTarget,
} from '../../config/socialIngestion.js';

export interface SocialFeedIngestionRecord {
  externalId: string;
  text: string;
  authorName?: string | null;
  authorHandle?: string | null;
  channelName?: string;
  postedAt: Date;
  permalink?: string | null;
  media?: SocialMediaAttachmentType[];
  metadata?: SocialFeedItemMetadataType;
}

export interface SocialVideoIngestionRecord {
  externalId: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  videoUrl: string;
  publishedAt: Date;
  durationSeconds?: number | null;
  isLive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface DiscordMessageIngestionRecord {
  messageId: string;
  content: string;
  authorDisplayName: string;
  authorId?: string;
  authorAvatarUrl?: string | null;
  postedAt: Date;
  attachments?: CommunityMessageAttachmentType[];
  permalink?: string | null;
}

export interface SocialIngestionConnector {
  readonly name: string;
  readonly enabled: boolean;
  readonly intervalMs: number;
  ingest(): Promise<void>;
}

export interface TwitterConnectorOptions {
  bearerToken?: string;
  maxResults: number;
  targets: TwitterIngestionTarget[];
  intervalMs: number;
  enabled: boolean;
}

export interface YouTubeConnectorOptions {
  apiKey?: string;
  targets: YouTubeIngestionTarget[];
  targetsProvider?: () => Promise<YouTubeIngestionTarget[]>;
  intervalMs: number;
  enabled: boolean;
}

export interface DiscordConnectorOptions {
  botToken?: string;
  limit: number;
  targetsProvider: () => Promise<DiscordIngestionTarget[]>;
  intervalMs: number;
  enabled: boolean;
}
