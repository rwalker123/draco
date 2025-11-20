import { Prisma } from '#prisma/client';
import { BaseSocialIngestionConnector } from './baseConnector.js';
import { SocialFeedIngestionRecord, TwitterConnectorOptions } from '../ingestionTypes.js';
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
    super('twitter', options.enabled && options.targets.length > 0, options.intervalMs);
  }

  protected async runIngestion(): Promise<void> {
    if (!this.options.bearerToken) {
      console.warn('[twitter] Skipping ingestion because bearer token is not configured.');
      return;
    }

    if (!this.options.targets.length) {
      return;
    }

    for (const target of this.options.targets) {
      const tweets = await this.fetchRecentTweets(target.handle);
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

  private async fetchRecentTweets(handle: string): Promise<SocialFeedIngestionRecord[]> {
    const query = new URL('https://api.twitter.com/2/tweets/search/recent');
    query.searchParams.set('query', `from:${handle}`);
    query.searchParams.set('tweet.fields', 'author_id,created_at,public_metrics');
    query.searchParams.set('expansions', 'author_id,attachments.media_keys');
    query.searchParams.set('media.fields', 'url,preview_image_url,type');
    query.searchParams.set('max_results', String(this.options.maxResults));

    try {
      const response = await fetchJson<TwitterApiResponse>(query, {
        headers: {
          Authorization: `Bearer ${this.options.bearerToken as string}`,
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
      console.error(`[twitter] Failed to fetch tweets for @${handle}`, error);
      return [];
    }
  }
}
