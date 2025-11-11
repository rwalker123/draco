import { Prisma } from '@prisma/client';
import { BaseSocialIngestionConnector } from './baseConnector.js';
import { DiscordConnectorOptions, DiscordMessageIngestionRecord } from '../ingestionTypes.js';
import { ISocialContentRepository } from '../../../repositories/interfaces/ISocialContentRepository.js';
import { fetchJson } from '../../../utils/fetchJson.js';

interface DiscordMessage {
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
  }>;
}

export class DiscordConnector extends BaseSocialIngestionConnector {
  constructor(
    private readonly repository: ISocialContentRepository,
    private readonly options: DiscordConnectorOptions,
  ) {
    super('discord', options.enabled && options.targets.length > 0, options.intervalMs);
  }

  protected async runIngestion(): Promise<void> {
    if (!this.options.botToken) {
      console.warn('[discord] Skipping ingestion because bot token is not configured.');
      return;
    }

    for (const target of this.options.targets) {
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
          avatarurl: null,
          content: message.content,
          attachments: message.attachments?.length
            ? (JSON.parse(JSON.stringify(message.attachments)) as Prisma.InputJsonValue)
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
        postedAt: new Date(message.timestamp),
        attachments: message.attachments?.map((attachment) => ({
          type: attachment.content_type?.startsWith('video')
            ? 'video'
            : attachment.content_type?.startsWith('image')
              ? 'image'
              : 'file',
          url: attachment.url,
          thumbnailUrl: attachment.proxy_url ?? null,
        })),
        permalink: '',
      }));
    } catch (error) {
      console.error(`[discord] Failed to fetch messages for channel ${channelId}`, error);
      return [];
    }
  }
}
