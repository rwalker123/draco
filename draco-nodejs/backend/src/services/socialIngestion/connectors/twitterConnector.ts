import { Prisma } from '#prisma/client';
import { BaseSocialIngestionConnector } from './baseConnector.js';
import {
  SocialFeedIngestionRecord,
  TwitterConnectorOptions,
  TwitterIngestionTargetWithAuth,
} from '../ingestionTypes.js';
import type { SocialMediaAttachmentType } from '@draco/shared-schemas';
import { deterministicUuid } from '../../../utils/deterministicUuid.js';
import { fetchJson } from '../../../utils/fetchJson.js';
import { ISocialContentRepository } from '../../../repositories/interfaces/ISocialContentRepository.js';

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
  constructor(
    private readonly repository: ISocialContentRepository,
    private readonly options: TwitterConnectorOptions,
  ) {
    super('twitter', options.enabled, options.intervalMs);
  }

  protected async runIngestion(): Promise<void> {
    const targets = await this.options.targetsProvider();
    if (!targets.length) {
      return;
    }

    const requestsPerWindowBudget = 400; // stay safely below typical 450/15m limit
    const windowMs = 15 * 60 * 1000;
    const allowedPerRun = Math.max(
      1,
      Math.floor((requestsPerWindowBudget * this.options.intervalMs) / windowMs),
    );

    const limitedTargets =
      targets.length > allowedPerRun ? targets.slice(0, allowedPerRun) : targets;

    if (targets.length > allowedPerRun) {
      console.warn('[twitter] Skipping extra ingestion targets to stay within rate limits', {
        considered: targets.length,
        allowedThisRun: allowedPerRun,
      });
    }

    for (const target of limitedTargets) {
      if (!target.bearerToken) {
        console.warn('[twitter] Skipping ingestion target without bearer token', {
          accountId: target.accountId.toString(),
          handle: target.handle,
        });
        continue;
      }

      const tweets = await this.fetchRecentTweets(target);
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

      await this.repository.createFeedItems(payload);
      console.info(`[twitter] Ingested ${payload.length} posts for @${target.handle}`);
    }
  }

  private async fetchRecentTweets(
    target: TwitterIngestionTargetWithAuth,
  ): Promise<SocialFeedIngestionRecord[]> {
    const { handle, bearerToken } = target;
    const query = new URL('https://api.twitter.com/2/tweets/search/recent');
    query.searchParams.set('query', `from:${handle}`);
    query.searchParams.set('tweet.fields', 'author_id,created_at,public_metrics');
    query.searchParams.set('expansions', 'author_id,attachments.media_keys');
    query.searchParams.set('media.fields', 'url,preview_image_url,type');
    query.searchParams.set('max_results', String(this.options.maxResults));

    const maxAttempts = 3;
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt += 1;
      try {
        const response = await fetchJson<TwitterApiResponse>(query, {
          headers: {
            Authorization: `Bearer ${bearerToken as string}`,
          },
          timeoutMs: 8000,
        });

        if (!response.data?.length) {
          return [];
        }

        const mediaMap = new Map(
          response.includes?.media?.map((media) => [media.media_key, media]) ?? [],
        );

        const userMap = new Map(response.includes?.users?.map((user) => [user.id, user]) ?? []);

        return response.data.map((tweet) => {
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
      } catch (error) {
        const status = (error as { status?: number }).status;
        if (status === 429 && attempt < maxAttempts) {
          const backoffMs = 2000 * attempt;
          console.warn('[twitter] Rate limited fetching tweets, backing off', {
            handle,
            attempt,
            backoffMs,
          });
          await this.sleep(backoffMs);
          continue;
        }

        console.error(`[twitter] Failed to fetch tweets for @${handle}`, error);
        return [];
      }
    }

    return [];
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
