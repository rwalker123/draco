import { SocialFeedItemType, SocialMediaAttachmentType } from '@draco/shared-schemas';
import {
  RepositoryFactory,
  IAccountRepository,
  ISeasonsRepository,
} from '../repositories/index.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import { decryptSecret } from '../utils/secretEncryption.js';
import { fetchJson, HttpError } from '../utils/fetchJson.js';
import { deterministicUuid } from '../utils/deterministicUuid.js';
import { AccountSettingsService } from './accountSettingsService.js';
import type { TwitterIngestionTarget } from '../config/socialIngestion.js';

interface TwitterUserResponse {
  data?: {
    id: string;
    name?: string;
    username?: string;
  };
}

interface TwitterTweetResponse {
  data?: Array<{
    id: string;
    text: string;
    created_at?: string;
    public_metrics?: {
      like_count?: number;
      reply_count?: number;
      impression_count?: number;
    };
    attachments?: {
      media_keys?: string[];
    };
  }>;
  includes?: {
    media?: Array<{ media_key: string; type: string; url?: string; preview_image_url?: string }>;
  };
}

interface TwitterPostResponse {
  data?: {
    id: string;
    text: string;
  };
}

interface AccountTwitterCredentials {
  accountId: bigint;
  handle: string;
  oauthToken?: string;
  oauthSecret?: string;
}

interface TwitterGameResultPayload {
  gameId: bigint;
  gameDate?: Date;
  gameStatus?: number | null;
  homeScore?: number | null;
  visitorScore?: number | null;
  homeTeamName?: string;
  visitorTeamName?: string;
  leagueName?: string | null;
  seasonName?: string | null;
}

export class TwitterIntegrationService {
  private readonly accountRepository: IAccountRepository;
  private readonly seasonsRepository: ISeasonsRepository;
  private readonly accountSettingsService = new AccountSettingsService();

  constructor(accountRepository?: IAccountRepository, seasonsRepository?: ISeasonsRepository) {
    this.accountRepository = accountRepository ?? RepositoryFactory.getAccountRepository();
    this.seasonsRepository = seasonsRepository ?? RepositoryFactory.getSeasonsRepository();
  }

  async listIngestionTargets(): Promise<(TwitterIngestionTarget & { bearerToken: string })[]> {
    const accounts = await this.accountRepository.findMany({
      twitteraccountname: { not: '' },
      twitteroauthtoken: { not: '' },
    });

    const targets: Array<TwitterIngestionTarget & { bearerToken: string }> = [];

    for (const account of accounts) {
      const season = await this.seasonsRepository.findCurrentSeason(account.id);
      if (!season) {
        console.warn('[twitter] Skipping ingestion target because no current season is set', {
          accountId: account.id.toString(),
        });
        continue;
      }

      const token = this.decryptSecretValue(account.twitteroauthtoken);
      if (!token) {
        console.warn('[twitter] Skipping ingestion target without bearer token', {
          accountId: account.id.toString(),
        });
        continue;
      }

      targets.push({
        accountId: account.id,
        seasonId: season.id,
        handle: account.twitteraccountname?.replace(/^@/, '') ?? '',
        bearerToken: token,
      });
    }

    return targets;
  }

  async listRecentTweets(accountId: bigint, limit = 5): Promise<SocialFeedItemType[]> {
    const credentials = await this.getAccountCredentials(accountId);
    const bearerToken = await this.resolveBearerToken(credentials);

    if (!bearerToken) {
      throw new ValidationError('Twitter credentials are not configured for this account');
    }

    const user = await this.fetchUser(credentials.handle, bearerToken);

    if (!user?.id) {
      throw new ValidationError('Twitter handle could not be resolved');
    }

    const tweetResponse = await this.fetchTweets(user.id, bearerToken, limit);
    const season = await this.seasonsRepository.findCurrentSeason(accountId);
    const seasonId = season?.id ?? accountId;

    if (!tweetResponse.data?.length) {
      return [];
    }

    const mediaMap = new Map(
      tweetResponse.includes?.media?.map((media) => [media.media_key, media]) ?? [],
    );

    return tweetResponse.data.map((tweet) => {
      const attachments: SocialMediaAttachmentType[] =
        tweet.attachments?.media_keys
          ?.map((key) => mediaMap.get(key))
          .filter((item): item is NonNullable<typeof item> => Boolean(item))
          .map((media) => ({
            type: media.type === 'video' || media.type === 'animated_gif' ? 'video' : 'image',
            url: media.url ?? media.preview_image_url ?? '',
            thumbnailUrl: media.preview_image_url ?? null,
          })) ?? [];

      const postedAt = tweet.created_at ? new Date(tweet.created_at) : new Date();

      return {
        id: deterministicUuid(`twitter:${accountId.toString()}:${tweet.id}`),
        accountId: accountId.toString(),
        seasonId: seasonId.toString(),
        source: 'twitter',
        channelName: `@${credentials.handle}`,
        authorHandle: user.username ? `@${user.username}` : undefined,
        authorName: user.name ?? undefined,
        content: tweet.text,
        media: attachments.length ? attachments : undefined,
        postedAt: postedAt.toISOString(),
        permalink: `https://twitter.com/${credentials.handle}/status/${tweet.id}`,
        metadata: tweet.public_metrics
          ? {
              reactions: tweet.public_metrics.like_count,
              replies: tweet.public_metrics.reply_count,
              viewCount: tweet.public_metrics.impression_count,
            }
          : undefined,
      } satisfies SocialFeedItemType;
    });
  }

  async postTweet(accountId: bigint, content: string): Promise<SocialFeedItemType> {
    const normalizedContent = content.trim();

    if (!normalizedContent) {
      throw new ValidationError('Tweet content is required');
    }

    const credentials = await this.getAccountCredentials(accountId);
    const bearerToken = await this.resolveBearerToken(credentials);

    if (!bearerToken) {
      throw new ValidationError('Twitter credentials are not configured for this account');
    }

    const response = await this.createTweet(normalizedContent, bearerToken);

    if (!response.data?.id) {
      throw new ValidationError('Twitter did not return a tweet identifier');
    }

    const season = await this.seasonsRepository.findCurrentSeason(accountId);
    const seasonId = season?.id ?? accountId;

    return {
      id: deterministicUuid(`twitter:${accountId.toString()}:${response.data.id}`),
      accountId: accountId.toString(),
      seasonId: seasonId.toString(),
      source: 'twitter',
      channelName: `@${credentials.handle}`,
      authorHandle: `@${credentials.handle}`,
      content: response.data.text ?? normalizedContent,
      postedAt: new Date().toISOString(),
      permalink: `https://twitter.com/${credentials.handle}/status/${response.data.id}`,
    } satisfies SocialFeedItemType;
  }

  async publishGameResult(accountId: bigint, payload: TwitterGameResultPayload): Promise<void> {
    try {
      if (!(await this.shouldPostGameResults(accountId))) {
        return;
      }

      const content = this.composeGameResultTweet(payload);
      if (!content) {
        return;
      }

      await this.postTweet(accountId, content);
    } catch (error) {
      console.error('[twitter] Failed to publish game result', {
        accountId: accountId.toString(),
        gameId: payload.gameId.toString(),
        error,
      });
    }
  }

  private async shouldPostGameResults(accountId: bigint): Promise<boolean> {
    const settings = await this.accountSettingsService.getAccountSettings(accountId);
    const postResultsSetting = settings.find(
      (setting) => setting.definition.key === 'PostGameResultsToTwitter',
    );
    return Boolean(postResultsSetting?.effectiveValue);
  }

  private composeGameResultTweet(payload: TwitterGameResultPayload): string | null {
    const trimLine = (value?: string | null, max = 60) => {
      const safe = value?.trim();
      if (!safe) {
        return '';
      }
      return safe.length > max ? `${safe.slice(0, max - 1)}…` : safe;
    };

    const trimName = (name?: string) => {
      const safe = name?.trim() || '';
      if (!safe) {
        return safe;
      }
      return safe.length > 30 ? `${safe.slice(0, 27)}...` : safe;
    };

    const isRainout = payload.gameStatus === 2;
    const hasScores =
      !isRainout &&
      payload.homeScore !== undefined &&
      payload.homeScore !== null &&
      payload.visitorScore !== undefined &&
      payload.visitorScore !== null;

    const homeName = trimName(payload.homeTeamName) || 'Home';
    const visitorName = trimName(payload.visitorTeamName) || 'Visitor';

    const nameColumnWidth = Math.min(Math.max(visitorName.length, homeName.length, 10), 40);
    const scoreColumnWidth = 5;

    const topBorder = `┌${'─'.repeat(nameColumnWidth + 2)}┬${'─'.repeat(scoreColumnWidth + 2)}┐`;
    const middleBorder = `├${'─'.repeat(nameColumnWidth + 2)}┼${'─'.repeat(scoreColumnWidth + 2)}┤`;
    const bottomBorder = `└${'─'.repeat(nameColumnWidth + 2)}┴${'─'.repeat(scoreColumnWidth + 2)}┘`;

    const formatRow = (name: string, score?: number | null) => {
      const scoreValue = score ?? ' ';
      return `│ ${name.padEnd(nameColumnWidth, ' ')} │ ${String(scoreValue).padStart(scoreColumnWidth, ' ')} │`;
    };

    const scoreLines = [
      topBorder,
      formatRow(visitorName, hasScores ? payload.visitorScore : undefined),
      middleBorder,
      formatRow(homeName, hasScores ? payload.homeScore : undefined),
      bottomBorder,
    ];

    const statusLabel = this.describeGameStatus(payload.gameStatus);
    const formattedDate = payload.gameDate ? payload.gameDate.toISOString().split('T')[0] : null;

    const header = [trimLine(payload.leagueName), trimLine(payload.seasonName)]
      .filter(Boolean)
      .join(' • ');

    const details = [
      statusLabel ? `Status: ${statusLabel}` : null,
      formattedDate ? `Date: ${formattedDate}` : null,
    ]
      .filter((segment): segment is string => Boolean(segment))
      .join(' • ');

    const table = ['```', ...scoreLines, '```'].join('\n');

    const parts = [header || null, table, details || null].filter((segment): segment is string =>
      Boolean(segment),
    );

    let message = parts.join('\n');

    if (message.length > 275 && details) {
      message = [header || null, table]
        .filter((segment): segment is string => Boolean(segment))
        .join('\n');
    }

    return message.length <= 280 ? message : message.slice(0, 280);
  }

  private describeGameStatus(gameStatus?: number | null): string | null {
    switch (gameStatus) {
      case 1:
        return 'Final';
      case 2:
        return 'Rainout';
      case 3:
        return 'Postponed';
      case 4:
        return 'Forfeit';
      case 5:
        return 'Did Not Report';
      case 0:
        return 'Scheduled';
      default:
        return null;
    }
  }

  private decryptSecretValue(value?: string | null): string | undefined {
    if (!value) {
      return undefined;
    }

    try {
      return decryptSecret(value);
    } catch {
      return value;
    }
  }

  private async getAccountCredentials(accountId: bigint): Promise<AccountTwitterCredentials> {
    const account = await this.accountRepository.findById(accountId);

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    const handle = account.twitteraccountname?.trim();
    const oauthToken = this.decryptSecretValue(account.twitteroauthtoken)?.trim();
    const oauthSecret = this.decryptSecretValue(account.twitteroauthsecretkey)?.trim();

    if (!handle) {
      throw new ValidationError('Twitter account handle is not configured');
    }

    return {
      accountId: account.id,
      handle: handle.replace(/^@/, ''),
      oauthToken: oauthToken || undefined,
      oauthSecret: oauthSecret || undefined,
    };
  }

  private async resolveBearerToken(credentials: AccountTwitterCredentials): Promise<string | null> {
    if (credentials.oauthToken && !credentials.oauthSecret) {
      return credentials.oauthToken;
    }

    if (credentials.oauthToken && credentials.oauthSecret) {
      try {
        const basicToken = Buffer.from(
          `${credentials.oauthToken}:${credentials.oauthSecret}`,
          'utf8',
        ).toString('base64');

        const tokenResponse = await fetchJson<{ token_type?: string; access_token?: string }>(
          'https://api.twitter.com/oauth2/token',
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${basicToken}`,
              'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            },
            body: 'grant_type=client_credentials',
            timeoutMs: 8000,
          },
        );

        if (tokenResponse.token_type?.toLowerCase() === 'bearer' && tokenResponse.access_token) {
          return tokenResponse.access_token;
        }
      } catch (error) {
        console.warn('Failed to exchange Twitter credentials for bearer token', error);
      }
    }

    return credentials.oauthToken ?? null;
  }

  private async fetchUser(
    handle: string,
    bearerToken: string,
  ): Promise<TwitterUserResponse['data']> {
    try {
      const userResponse = await fetchJson<TwitterUserResponse>(
        `https://api.twitter.com/2/users/by/username/${encodeURIComponent(handle)}`,
        {
          headers: { Authorization: `Bearer ${bearerToken}` },
          timeoutMs: 8000,
        },
      );

      return userResponse.data;
    } catch (error) {
      if (error instanceof HttpError) {
        console.error('Twitter user lookup failed', error.message);
        throw new ValidationError('Twitter handle could not be resolved');
      }

      throw error;
    }
  }

  private async fetchTweets(
    userId: string,
    bearerToken: string,
    limit: number,
  ): Promise<TwitterTweetResponse> {
    const maxResults = Math.min(Math.max(limit, 1), 50);
    const url = new URL(`https://api.twitter.com/2/users/${userId}/tweets`);
    url.searchParams.set('max_results', String(maxResults));
    url.searchParams.set('tweet.fields', 'created_at,public_metrics');
    url.searchParams.set('expansions', 'attachments.media_keys');
    url.searchParams.set('media.fields', 'url,preview_image_url,type');

    try {
      return await fetchJson<TwitterTweetResponse>(url, {
        headers: { Authorization: `Bearer ${bearerToken}` },
        timeoutMs: 8000,
      });
    } catch (error) {
      if (error instanceof HttpError) {
        console.error('Twitter timeline fetch failed', error.message);
        throw new ValidationError('Unable to fetch tweets from Twitter');
      }

      throw error;
    }
  }

  private async createTweet(content: string, bearerToken: string): Promise<TwitterPostResponse> {
    try {
      return await fetchJson<TwitterPostResponse>('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: content }),
        timeoutMs: 8000,
      });
    } catch (error) {
      if (error instanceof HttpError) {
        console.error('Twitter API rejected tweet request', error.message);
        throw new ValidationError('Twitter rejected the tweet request');
      }

      throw error;
    }
  }
}
