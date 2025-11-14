import { Prisma } from '@prisma/client';
import { BaseSocialIngestionConnector } from './baseConnector.js';
import { DiscordConnectorOptions, DiscordMessageIngestionRecord } from '../ingestionTypes.js';
import { ISocialContentRepository } from '../../../repositories/interfaces/ISocialContentRepository.js';
import { fetchJson, HttpError } from '../../../utils/fetchJson.js';
import type { DiscordIngestionTarget } from '../../../config/socialIngestion.js';

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

interface CachedDiscordMessage {
  postedAtMs: number;
  signature: string;
}

export class DiscordConnector extends BaseSocialIngestionConnector {
  private readonly messageCache = new Map<string, CachedDiscordMessage>();
  private nextAllowedRun = 0;
  private globalCooldownUntil = 0;

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

    if (Date.now() < this.nextAllowedRun || Date.now() < this.globalCooldownUntil) {
      return;
    }

    const targets = await this.options.targetsProvider();
    if (!targets.length) {
      console.info('[discord] No Discord channel mappings configured. Skipping run.');
      return;
    }

    for (const target of targets) {
      const messages = await this.fetchChannelMessages(target.channelId);
      let ingestedCount = 0;

      for (const message of messages) {
        if (this.isMessageCached(target, message)) {
          continue;
        }

        await this.repository.upsertCommunityMessage({
          id: this.buildCommunityMessageId(target.accountId, message.messageId),
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
          postedat: message.postedAt,
          permalink: message.permalink ?? '',
        });

        this.cacheMessage(target, message);
        ingestedCount += 1;
      }

      const deletedCount = await this.removeDeletedMessages(target, messages);

      if (ingestedCount > 0) {
        console.info(
          `[discord] Ingested ${ingestedCount} messages for channel ${target.channelId}`,
        );
      } else if (deletedCount > 0) {
        console.info(
          `[discord] Removed ${deletedCount} deleted messages for channel ${target.channelId}`,
        );
      } else {
        console.info(`[discord] No changes for channel ${target.channelId}`);
      }
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
      if (error instanceof HttpError && error.status === 429) {
        const retryAfterMs = this.extractRetryAfterMs(error.body);
        console.warn(
          `[discord] Rate limit hit for channel ${channelId}. Pausing for ${retryAfterMs}ms`,
        );
        this.nextAllowedRun = Date.now() + retryAfterMs;
      } else if (error instanceof HttpError && error.status >= 500) {
        console.error(`[discord] Discord API error ${error.status} for channel ${channelId}`);
      } else {
        console.error(`[discord] Failed to fetch messages for channel ${channelId}`, error);
      }
      return [];
    }
  }

  private extractRetryAfterMs(body: string): number {
    try {
      const parsed = JSON.parse(body);
      const retrySeconds = typeof parsed?.retry_after === 'number' ? parsed.retry_after : 1;
      const isGlobal = Boolean(parsed?.global);
      if (isGlobal) {
        this.globalCooldownUntil = Date.now() + retrySeconds * 1000;
      }
      return Math.max(1000, retrySeconds * 1000);
    } catch {
      return 5000;
    }
  }

  private buildAvatarUrl(userId: string, avatarHash?: string | null): string | null {
    if (!userId || !avatarHash) {
      return null;
    }

    const extension = avatarHash.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${extension}?size=64`;
  }

  private isMessageCached(
    target: DiscordIngestionTarget,
    message: DiscordMessageIngestionRecord,
  ): boolean {
    const key = this.getMessageCacheKey(target, message.messageId);
    const cached = this.messageCache.get(key);
    if (!cached) {
      return false;
    }

    const signature = this.buildMessageSignature(message);
    const postedAtMs = message.postedAt.getTime();
    return cached.postedAtMs === postedAtMs && cached.signature === signature;
  }

  private cacheMessage(
    target: DiscordIngestionTarget,
    message: DiscordMessageIngestionRecord,
  ): void {
    const key = this.getMessageCacheKey(target, message.messageId);
    this.messageCache.set(key, {
      postedAtMs: message.postedAt.getTime(),
      signature: this.buildMessageSignature(message),
    });
  }

  private getMessageCacheKey(target: DiscordIngestionTarget, messageId: string): string {
    return `${this.getCachePrefix(target)}${messageId}`;
  }

  private getCachePrefix(target: DiscordIngestionTarget): string {
    return `${target.accountId.toString()}:${target.channelId}:`;
  }

  private buildMessageSignature(message: DiscordMessageIngestionRecord): string {
    return JSON.stringify({
      content: message.content,
      attachments: message.attachments ?? [],
      permalink: message.permalink ?? '',
    });
  }

  private buildCommunityMessageId(accountId: bigint, messageId: string): string {
    return `${accountId.toString()}-${messageId}`;
  }

  private async removeDeletedMessages(
    target: DiscordIngestionTarget,
    messages: DiscordMessageIngestionRecord[],
  ): Promise<number> {
    const prefix = this.getCachePrefix(target);
    const activeMessageIds = new Set(messages.map((message) => message.messageId));
    const keysToRemove: string[] = [];

    for (const key of this.messageCache.keys()) {
      if (!key.startsWith(prefix)) {
        continue;
      }

      const cachedMessageId = key.slice(prefix.length);
      if (!activeMessageIds.has(cachedMessageId)) {
        keysToRemove.push(key);
      }
    }

    if (!keysToRemove.length) {
      return 0;
    }

    const idsToDelete = keysToRemove.map((key) =>
      this.buildCommunityMessageId(target.accountId, key.slice(prefix.length)),
    );
    await this.repository.deleteCommunityMessages(idsToDelete);
    keysToRemove.forEach((key) => this.messageCache.delete(key));
    return idsToDelete.length;
  }
}
