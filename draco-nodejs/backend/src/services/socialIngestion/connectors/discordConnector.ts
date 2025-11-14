import { Prisma } from '@prisma/client';
import { BaseSocialIngestionConnector } from './baseConnector.js';
import { DiscordConnectorOptions, DiscordMessageIngestionRecord } from '../ingestionTypes.js';
import { ISocialContentRepository } from '../../../repositories/interfaces/ISocialContentRepository.js';
import { fetchJson } from '../../../utils/fetchJson.js';
import { normalizeDiscordMessage } from '../transformers/discordMessageTransformer.js';

export interface DiscordMessage {
  id: string;
  content: string;
  timestamp: string;
  author: {
    id: string;
    username: string;
    global_name?: string;
    display_name?: string;
    avatar?: string;
  };
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    proxy_url?: string;
    content_type?: string;
    size?: number;
  }>;
  embeds?: Array<{
    type?: string;
    url?: string;
    thumbnail?: {
      url?: string;
    };
    video?: {
      url?: string;
      proxy_url?: string;
    };
  }>;
  reactions?: Array<{
    count: number;
    me: boolean;
    emoji: {
      id?: string;
      name?: string;
      animated?: boolean;
    };
  }>;
  sticker_items?: Array<{
    id: string;
    name: string;
    format_type: number;
  }>;
  mentions?: Array<{
    id: string;
    username: string;
    global_name?: string;
    display_name?: string;
  }>;
  mention_roles?: string[];
  mention_channels?: Array<{
    id: string;
    name?: string;
  }>;
}

export class DiscordConnector extends BaseSocialIngestionConnector {
  constructor(
    private readonly repository: ISocialContentRepository,
    private readonly options: DiscordConnectorOptions,
  ) {
    super('discord', options.enabled, options.intervalMs);
  }

  protected async runIngestion(): Promise<void> {
    if (!this.options.botToken) {
      console.warn('[discord] Skipping ingestion because bot token is not configured.');
      return;
    }

    const targets = await this.options.targetsProvider();
    if (!targets.length) {
      console.info('[discord] No Discord channel mappings configured. Skipping run.');
      return;
    }

    for (const target of targets) {
      const messages = await this.fetchChannelMessages(target.channelId);
      if (!messages.length) {
        continue;
      }

      for (const message of messages) {
        await this.repository.upsertCommunityMessage({
          id: `${target.accountId.toString()}-${message.messageId}`,
          accountid: target.accountId,
          seasonid: target.seasonId,
          teamid: target.teamId ?? null,
          teamseasonid: target.teamSeasonId ?? null,
          channelid: target.channelId,
          channelname: target.label ?? target.channelId,
          authorid: message.authorId ?? message.messageId,
          authorname: message.authorDisplayName,
          avatarurl: message.authorAvatarUrl ?? null,
          content: message.content,
          attachments: message.attachments?.length
            ? (JSON.parse(JSON.stringify(message.attachments)) as Prisma.InputJsonValue)
            : undefined,
          richcontent: message.richContent?.length
            ? (JSON.parse(JSON.stringify(message.richContent)) as Prisma.InputJsonValue)
            : undefined,
          postedat: message.postedAt,
          permalink: message.permalink ?? '',
        });
      }

      console.info(
        `[discord] Ingested ${messages.length} messages for channel ${target.channelId}`,
      );
    }
  }

  private async fetchChannelMessages(channelId: string): Promise<DiscordMessageIngestionRecord[]> {
    const url = new URL(`https://discord.com/api/v10/channels/${channelId}/messages`);
    url.searchParams.set('limit', String(Math.min(this.options.limit, 50)));

    try {
      const response = await fetchJson<DiscordMessage[]>(url, {
        headers: {
          Authorization: `Bot ${this.options.botToken as string}`,
        },
        timeoutMs: 5000,
      });

      if (!Array.isArray(response) || !response.length) {
        return [];
      }

      return response.map((message) => ({
        messageId: message.id,
        content: message.content,
        authorDisplayName:
          message.author.display_name ?? message.author.global_name ?? message.author.username,
        authorId: message.author.id,
        authorAvatarUrl: this.buildAvatarUrl(message.author.id, message.author.avatar),
        postedAt: new Date(message.timestamp),
        ...(() => {
          const normalized = normalizeDiscordMessage(message);
          return {
            attachments: normalized.attachments.length ? normalized.attachments : undefined,
            richContent: normalized.richContent.length ? normalized.richContent : undefined,
          };
        })(),
        permalink: '',
      }));
    } catch (error) {
      console.error(`[discord] Failed to fetch messages for channel ${channelId}`, error);
      return [];
    }
  }

  private buildAvatarUrl(userId: string, avatarHash?: string | null): string | null {
    if (!userId || !avatarHash) {
      return null;
    }

    const extension = avatarHash.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${extension}?size=64`;
  }
}
