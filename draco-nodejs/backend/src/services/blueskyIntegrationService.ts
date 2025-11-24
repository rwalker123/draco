import { SocialFeedItemType, SocialMediaAttachmentType } from '@draco/shared-schemas';
import {
  RepositoryFactory,
  IAccountRepository,
  ISeasonsRepository,
  IAccountBlueskyCredentialsRepository,
} from '../repositories/index.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import { decryptSecret } from '../utils/secretEncryption.js';
import { fetchJson, HttpError } from '../utils/fetchJson.js';
import { deterministicUuid } from '../utils/deterministicUuid.js';
import { AccountSettingsService } from './accountSettingsService.js';
import type { BlueskyIngestionTarget } from '../config/socialIngestion.js';

interface BlueskyFeedItem {
  post?: {
    uri: string;
    cid?: string;
    author?: {
      did?: string;
      handle?: string;
      displayName?: string;
    };
    record?: {
      text?: string;
      createdAt?: string;
    };
    embed?: {
      images?: Array<{
        fullsize?: string;
        thumb?: string;
        alt?: string;
      }>;
    };
    indexedAt?: string;
  };
}

interface BlueskyFeedResponse {
  feed?: BlueskyFeedItem[];
}

interface BlueskySessionResponse {
  accessJwt?: string;
  did?: string;
}

interface AccountBlueskyCredentials {
  accountId: bigint;
  handle: string;
  appPassword?: string;
}

interface BlueskyGameResultPayload {
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

export class BlueskyIntegrationService {
  private readonly accountRepository: IAccountRepository;
  private readonly seasonsRepository: ISeasonsRepository;
  private readonly accountBlueskyCredentialsRepository: IAccountBlueskyCredentialsRepository;
  private readonly accountSettingsService = new AccountSettingsService();

  constructor() {
    this.accountRepository = RepositoryFactory.getAccountRepository();
    this.seasonsRepository = RepositoryFactory.getSeasonsRepository();
    this.accountBlueskyCredentialsRepository =
      RepositoryFactory.getAccountBlueskyCredentialsRepository();
  }

  async listRecentPosts(accountId: bigint, limit = 5): Promise<SocialFeedItemType[]> {
    const credentials = await this.getAccountCredentials(accountId);
    const feedResponse = await this.fetchAuthorFeed(credentials.handle, limit);
    const season = await this.seasonsRepository.findCurrentSeason(accountId);
    const seasonId = season?.id ?? accountId;

    if (!feedResponse.feed?.length) {
      return [];
    }

    return feedResponse.feed
      .map((item) => item.post)
      .filter((post): post is NonNullable<typeof post> => Boolean(post?.uri))
      .map((post) => this.mapFeedItem(accountId, seasonId, credentials.handle, post));
  }

  async fetchRecentPostsForTarget(
    target: BlueskyIngestionTarget,
    limit = 5,
  ): Promise<SocialFeedItemType[]> {
    const feedResponse = await this.fetchAuthorFeed(target.handle, limit);

    if (!feedResponse.feed?.length) {
      return [];
    }

    return feedResponse.feed
      .map((item) => item.post)
      .filter((post): post is NonNullable<typeof post> => Boolean(post?.uri))
      .map((post) =>
        this.mapFeedItem(target.accountId, target.seasonId, target.handle, post, {
          teamId: target.teamId,
          teamSeasonId: target.teamSeasonId,
        }),
      );
  }

  async postUpdate(accountId: bigint, content: string): Promise<SocialFeedItemType> {
    const normalizedContent = content.trim();

    if (!normalizedContent) {
      throw new ValidationError('Post content is required');
    }

    const credentials = await this.getAccountCredentials(accountId);
    const appPassword = this.resolveAppPassword(credentials);

    if (!appPassword) {
      throw new ValidationError('Bluesky credentials are not configured for this account');
    }

    const session = await this.createSession(credentials.handle, appPassword);

    if (!session.accessJwt || !session.did) {
      throw new ValidationError('Bluesky did not return a valid session');
    }

    const postUri = await this.createPost(normalizedContent, session.accessJwt, session.did);
    const season = await this.seasonsRepository.findCurrentSeason(accountId);
    const seasonId = season?.id ?? accountId;

    return {
      id: deterministicUuid(`bluesky:${accountId.toString()}:${postUri}`),
      accountId: accountId.toString(),
      seasonId: seasonId.toString(),
      source: 'bluesky',
      channelName: `@${credentials.handle}`,
      authorHandle: `@${credentials.handle}`,
      content: normalizedContent,
      postedAt: new Date().toISOString(),
      permalink: this.buildPermalink(credentials.handle, postUri),
    } satisfies SocialFeedItemType;
  }

  async publishGameResult(accountId: bigint, payload: BlueskyGameResultPayload): Promise<void> {
    try {
      if (!(await this.shouldPostGameResults(accountId))) {
        return;
      }

      const content = this.composeGameResultPost(payload);
      if (!content) {
        return;
      }

      await this.postUpdate(accountId, content);
    } catch (error) {
      console.error('[bluesky] Failed to publish game result', {
        accountId: accountId.toString(),
        gameId: payload.gameId.toString(),
        error,
      });
    }
  }

  private mapFeedItem(
    accountId: bigint,
    seasonId: bigint,
    accountHandle: string,
    post: NonNullable<BlueskyFeedItem['post']>,
    teamContext?: { teamId?: bigint; teamSeasonId?: bigint },
  ): SocialFeedItemType {
    const attachments: SocialMediaAttachmentType[] =
      post.embed?.images?.map((image) => ({
        type: 'image',
        url: image.fullsize || image.thumb || '',
        thumbnailUrl: image.thumb || image.fullsize || null,
      })) ?? [];

    const postedAt =
      post.record?.createdAt || post.indexedAt
        ? new Date(post.record?.createdAt ?? post.indexedAt)
        : new Date();
    const rkey = this.extractRkey(post.uri);

    return {
      id: deterministicUuid(`bluesky:${accountId.toString()}:${post.uri}`),
      accountId: accountId.toString(),
      seasonId: seasonId.toString(),
      teamId: teamContext?.teamId ? teamContext.teamId.toString() : undefined,
      teamSeasonId: teamContext?.teamSeasonId ? teamContext.teamSeasonId.toString() : undefined,
      source: 'bluesky',
      channelName: `@${accountHandle}`,
      authorHandle: post.author?.handle ? `@${post.author.handle}` : undefined,
      authorName: post.author?.displayName ?? undefined,
      content: post.record?.text ?? '',
      media: attachments.length ? attachments : undefined,
      postedAt: postedAt.toISOString(),
      permalink: this.buildPermalink(post.author?.handle ?? accountHandle, rkey),
    };
  }

  private async fetchAuthorFeed(handle: string, limit: number): Promise<BlueskyFeedResponse> {
    const maxResults = Math.min(Math.max(limit, 1), 50);
    const url = new URL('https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed');
    url.searchParams.set('actor', handle);
    url.searchParams.set('limit', String(maxResults));
    url.searchParams.set('filter', 'posts_no_replies');

    try {
      return await fetchJson<BlueskyFeedResponse>(url, { timeoutMs: 8000 });
    } catch (error) {
      if (error instanceof HttpError) {
        console.error('Bluesky author feed lookup failed', error.message);
        throw new ValidationError('Unable to fetch Bluesky posts');
      }

      throw error;
    }
  }

  private async createSession(
    identifier: string,
    appPassword: string,
  ): Promise<BlueskySessionResponse> {
    try {
      return await fetchJson<BlueskySessionResponse>(
        'https://bsky.social/xrpc/com.atproto.server.createSession',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password: appPassword }),
          timeoutMs: 8000,
        },
      );
    } catch (error) {
      if (error instanceof HttpError) {
        console.error('Bluesky session creation failed', error.message);
        throw new ValidationError('Bluesky rejected the credentials');
      }

      throw error;
    }
  }

  private async createPost(content: string, accessJwt: string, repo: string): Promise<string> {
    const record = {
      $type: 'app.bsky.feed.post',
      text: content,
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetchJson<{ uri?: string }>(
        'https://bsky.social/xrpc/com.atproto.repo.createRecord',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessJwt}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            repo,
            collection: 'app.bsky.feed.post',
            record,
          }),
          timeoutMs: 8000,
        },
      );

      if (!response.uri) {
        throw new ValidationError('Bluesky did not return a post URI');
      }

      return response.uri;
    } catch (error) {
      if (error instanceof HttpError) {
        console.error('Bluesky API rejected post request', error.message);
        throw new ValidationError('Bluesky rejected the post request');
      }

      throw error;
    }
  }

  private buildPermalink(handle: string, rkey?: string | null): string | undefined {
    if (!rkey) {
      return undefined;
    }

    return `https://bsky.app/profile/${handle.replace(/^@/, '')}/post/${rkey}`;
  }

  private extractRkey(uri?: string | null): string | null {
    if (!uri) {
      return null;
    }

    const segments = uri.split('/');
    return segments.length ? segments[segments.length - 1] : null;
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

  private async getAccountCredentials(accountId: bigint): Promise<AccountBlueskyCredentials> {
    const account = await this.accountBlueskyCredentialsRepository.findById(accountId);

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    const handle = account.blueskyhandle?.trim();
    const appPassword = this.decryptSecretValue(account.blueskyapppassword)?.trim();

    if (!handle) {
      throw new ValidationError('Bluesky handle is not configured');
    }

    return {
      accountId: account.id,
      handle: handle.replace(/^@/, ''),
      appPassword: appPassword || undefined,
    };
  }

  private resolveAppPassword(credentials: AccountBlueskyCredentials): string | null {
    return credentials.appPassword ?? null;
  }

  async listIngestionTargets(): Promise<BlueskyIngestionTarget[]> {
    const accounts = await this.accountBlueskyCredentialsRepository.findMany({
      blueskyhandle: { not: '' },
    });

    const targets: BlueskyIngestionTarget[] = [];

    for (const account of accounts) {
      const season = await this.seasonsRepository.findCurrentSeason(account.id);
      if (!season) {
        console.warn('[bluesky] Skipping ingestion target because no current season is set', {
          accountId: account.id.toString(),
        });
        continue;
      }

      targets.push({
        accountId: account.id,
        seasonId: season.id,
        handle: account.blueskyhandle?.replace(/^@/, '') ?? '',
      });
    }

    return targets;
  }

  private async shouldPostGameResults(accountId: bigint): Promise<boolean> {
    const settings = await this.accountSettingsService.getAccountSettings(accountId);
    const postResultsSetting = settings.find(
      (setting) => setting.definition.key === 'PostGameResultsToBluesky',
    );
    return Boolean(postResultsSetting?.effectiveValue);
  }

  private composeGameResultPost(payload: BlueskyGameResultPayload): string | null {
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

    if (message.length > 295 && details) {
      message = [header || null, table]
        .filter((segment): segment is string => Boolean(segment))
        .join('\n');
    }

    return message.length <= 300 ? message : message.slice(0, 300);
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
}
