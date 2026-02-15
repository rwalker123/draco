import { Prisma } from '#prisma/client';
import { BaseSocialIngestionConnector } from './baseConnector.js';
import {
  SocialFeedIngestionRecord,
  TwitterConnectorOptions,
  TwitterIngestionTargetWithAuth,
} from '../ingestionTypes.js';
import type { SocialMediaAttachmentType } from '@draco/shared-schemas';
import { deterministicUuid } from '../../../utils/deterministicUuid.js';
import { HttpError } from '../../../utils/fetchJson.js';
import { ISocialContentRepository } from '../../../repositories/interfaces/ISocialContentRepository.js';
import { SocialFeedCache } from './feedCache.js';

interface TwitterApiResponse {
  data?: Array<{
    id: string;
    text: string;
    created_at?: string;
    author_id?: string;
    public_metrics?: {
      like_count?: number;
      reply_count?: number;
      quote_count?: number;
      retweet_count?: number;
      impression_count?: number;
    };
    attachments?: {
      media_keys?: string[];
    };
  }>;
  includes?: {
    users?: Array<{ id: string; name: string; username: string }>;
    media?: Array<{ media_key: string; type: string; url?: string; preview_image_url?: string }>;
  };
}

export class TwitterConnector extends BaseSocialIngestionConnector {
  private readonly rateLimitUntilByToken = new Map<string, number>();
  private readonly feedCache: SocialFeedCache;

  constructor(
    private readonly repository: ISocialContentRepository,
    private readonly options: TwitterConnectorOptions,
  ) {
    super('twitter', options.enabled, options.intervalMs);
    this.feedCache = new SocialFeedCache(this.repository);
  }

  protected async runIngestion(): Promise<void> {
    const targets = await this.options.targetsProvider();
    if (!targets.length) {
      return;
    }

    const shouldLogVerbose = this.isDevelopmentEnvironment();

    for (const target of targets) {
      if (!target.bearerToken) {
        console.warn('[twitter] Skipping ingestion target without bearer token', {
          accountId: target.accountId.toString(),
          handle: target.handle,
        });
        continue;
      }

      const tokenKey = target.bearerToken as string;
      const blockedUntil = this.rateLimitUntilByToken.get(tokenKey);
      if (blockedUntil && Date.now() < blockedUntil) {
        console.warn('[twitter] Skipping ingestion target due to rate limit window', {
          handle: target.handle,
          retryAfter: new Date(blockedUntil).toISOString(),
        });
        continue;
      }

      if (shouldLogVerbose) {
        console.info('[twitter] Starting ingestion', {
          accountId: target.accountId.toString(),
          handle: target.handle,
        });
      }

      const tweets = await this.fetchRecentTweets(target);
      if (shouldLogVerbose) {
        console.info('[twitter] Finished ingestion', {
          accountId: target.accountId.toString(),
          handle: target.handle,
          ingestedCount: tweets.length,
        });
      }
      if (!tweets.length) {
        continue;
      }

      const payload = tweets.map((tweet) => ({
        id: deterministicUuid(`twitter:${target.accountId.toString()}:${tweet.externalId}`),
        accountid: target.accountId,
        seasonid: target.seasonId,
        teamid: target.teamId ?? null,
        teamseasonid: target.teamSeasonId ?? null,
        source: 'twitter',
        channelname: `@${target.handle}`,
        authorname: tweet.authorName ?? null,
        authorhandle: tweet.authorHandle ?? null,
        content: tweet.text,
        media: tweet.media?.length
          ? (JSON.parse(JSON.stringify(tweet.media)) as Prisma.InputJsonValue)
          : undefined,
        metadata: tweet.metadata
          ? (JSON.parse(JSON.stringify(tweet.metadata)) as Prisma.InputJsonValue)
          : undefined,
        postedat: tweet.postedAt,
        permalink: tweet.permalink ?? null,
      }));

      const freshPayload = await this.feedCache.filterNewItems(
        {
          source: 'twitter',
          accountId: target.accountId,
          seasonId: target.seasonId,
          teamId: target.teamId,
          teamSeasonId: target.teamSeasonId,
        },
        payload,
      );

      if (!freshPayload.length) {
        continue;
      }

      await this.repository.createFeedItems(freshPayload);
      if (shouldLogVerbose) {
        console.info(`[twitter] Ingested ${freshPayload.length} posts for @${target.handle}`);
      }
    }
  }

  private async fetchRecentTweets(
    target: TwitterIngestionTargetWithAuth,
  ): Promise<SocialFeedIngestionRecord[]> {
    const { handle, bearerToken } = target;
    const tokenKey = bearerToken as string;
    const query = new URL('https://api.twitter.com/2/tweets/search/recent');
    query.searchParams.set('query', `from:${handle}`);
    query.searchParams.set('tweet.fields', 'author_id,created_at,public_metrics');
    query.searchParams.set('expansions', 'author_id,attachments.media_keys');
    query.searchParams.set('media.fields', 'url,preview_image_url,type');
    query.searchParams.set('max_results', String(this.options.maxResults));

    try {
      const { body: response, headers } = await this.fetchTwitterJson<TwitterApiResponse>(
        query,
        tokenKey,
      );

      if (!response.data?.length) {
        return [];
      }

      const mediaMap = new Map(
        response.includes?.media?.map((media) => [media.media_key, media]) ?? [],
      );

      const userMap = new Map(response.includes?.users?.map((user) => [user.id, user]) ?? []);

      const records = response.data.map((tweet) => {
        const mediaEntries =
          (tweet.attachments?.media_keys
            ?.map((key) => mediaMap.get(key))
            .filter((item): item is NonNullable<typeof item> => Boolean(item))
            .map((item) => ({
              type: item.type === 'video' ? 'video' : 'image',
              url: item.url ?? item.preview_image_url ?? '',
              thumbnailUrl: item.preview_image_url ?? null,
            })) as SocialMediaAttachmentType[]) ?? [];

        const author = tweet.author_id ? userMap.get(tweet.author_id) : undefined;

        return {
          externalId: tweet.id,
          text: tweet.text,
          authorName: author?.name ?? null,
          authorHandle: author ? `@${author.username}` : null,
          channelName: handle,
          postedAt: tweet.created_at ? new Date(tweet.created_at) : new Date(),
          permalink: `https://twitter.com/${handle}/status/${tweet.id}`,
          media: mediaEntries.length ? mediaEntries : undefined,
          metadata: tweet.public_metrics
            ? {
                reactions: tweet.public_metrics.like_count,
                replies: tweet.public_metrics.reply_count,
                viewCount: tweet.public_metrics.impression_count,
              }
            : undefined,
        };
      });

      const remaining = this.parseNumberHeader(headers['x-rate-limit-remaining']);
      const resetSeconds = this.parseNumberHeader(headers['x-rate-limit-reset']);
      const resetMs = resetSeconds ? resetSeconds * 1000 : null;
      if (remaining !== null && remaining <= 0 && resetMs) {
        this.rateLimitUntilByToken.set(tokenKey, resetMs);
        console.warn('[twitter] Applied post-success rate limit window', {
          handle,
          retryAfter: new Date(resetMs).toISOString(),
          limit: this.parseNumberHeader(headers['x-rate-limit-limit']),
          remaining,
          reset: new Date(resetMs).toISOString(),
        });
      }

      return records;
    } catch (error) {
      const retryAfter = this.computeRetryAfter(error);
      if (retryAfter) {
        this.rateLimitUntilByToken.set(tokenKey, retryAfter.untilMs);
        console.warn('[twitter] Rate limited, setting cooldown until next window', {
          handle,
          retryAfter: new Date(retryAfter.untilMs).toISOString(),
          limit: retryAfter.limit ?? null,
          remaining: retryAfter.remaining ?? null,
          reset: retryAfter.resetIso ?? null,
        });
        return [];
      }
      console.error(`[twitter] Failed to fetch tweets for @${handle}`, { error });
      return [];
    }
  }

  private computeRetryAfter(error: unknown): {
    untilMs: number;
    hint: string;
    limit?: number | null;
    remaining?: number | null;
    resetIso?: string | null;
  } | null {
    if (!(error instanceof HttpError)) {
      return null;
    }

    const limit = this.parseNumberHeader(error.headers['x-rate-limit-limit']);
    const remaining = this.parseNumberHeader(error.headers['x-rate-limit-remaining']);
    const resetSeconds = this.parseNumberHeader(error.headers['x-rate-limit-reset']);
    const resetMs = resetSeconds ? resetSeconds * 1000 : null;

    if (error.status === 429) {
      const untilMs = resetMs ?? Date.now() + 15 * 60 * 1000;
      return {
        untilMs,
        hint: `Rate limited. Retry after ${new Date(untilMs).toISOString()}`,
        limit,
        remaining,
        resetIso: resetMs ? new Date(resetMs).toISOString() : null,
      };
    }

    if (error.status === 403 && error.body?.toLowerCase().includes('usage')) {
      const untilMs = Date.now() + 24 * 60 * 60 * 1000;
      return {
        untilMs,
        hint: 'Usage cap exceeded. Retry after the billing/window reset.',
        limit,
        remaining,
        resetIso: resetMs ? new Date(resetMs).toISOString() : null,
      };
    }

    return null;
  }

  private parseNumberHeader(value?: string): number | null {
    if (!value) {
      return null;
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

  private async fetchTwitterJson<T>(
    input: string | URL,
    bearerToken: string,
  ): Promise<{ body: T; headers: Record<string, string> }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(input, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
        signal: controller.signal,
      });

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });

      if (!response.ok) {
        const message = await response.text().catch(() => response.statusText);
        throw new HttpError(
          `Request to ${typeof input === 'string' ? input : input.toString()} failed with status ${
            response.status
          }: ${message}`,
          response.status,
          message,
          headers,
        );
      }

      if (response.status === 204) {
        return { body: {} as T, headers };
      }

      return { body: (await response.json()) as T, headers };
    } finally {
      clearTimeout(timeout);
    }
  }
}
