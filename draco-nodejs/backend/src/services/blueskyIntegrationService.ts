import {
  AnnouncementType,
  SocialFeedItemType,
  SocialMediaAttachmentType,
} from '@draco/shared-schemas';
import { ServiceFactory } from './serviceFactory.js';
import {
  RepositoryFactory,
  ISeasonsRepository,
  IAccountBlueskyCredentialsRepository,
} from '../repositories/index.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import { decryptSecret } from '../utils/secretEncryption.js';
import { fetchJson, HttpError } from '../utils/fetchJson.js';
import { deterministicUuid } from '../utils/deterministicUuid.js';
import type { BlueskyIngestionTarget } from '../config/socialIngestion.js';
import { composeGameResultMessage } from './socialGameResultFormatter.js';
import {
  composeWorkoutAnnouncementMessage,
  type WorkoutPostPayload,
} from './socialWorkoutFormatter.js';
import { stripHtml } from '../utils/emailContent.js';
import { resolveAccountFrontendBaseUrl } from '../utils/frontendBaseUrl.js';

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

type BlueskyWorkoutPayload = WorkoutPostPayload;
type BlueskyEmbed = {
  $type: 'app.bsky.embed.external';
  external: {
    uri: string;
    title: string;
    description?: string;
    thumb?: string;
  };
};
type BlueskyPostPayload = {
  text: string;
  embed?: BlueskyEmbed;
};

export class BlueskyIntegrationService {
  private readonly seasonsRepository: ISeasonsRepository;
  private readonly accountBlueskyCredentialsRepository: IAccountBlueskyCredentialsRepository;
  private readonly accountSettingsService = ServiceFactory.getAccountSettingsService();

  constructor() {
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

  async postUpdate(
    accountId: bigint,
    content: string,
    embed?: BlueskyEmbed,
  ): Promise<SocialFeedItemType> {
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

    const postUri = await this.createPost(normalizedContent, session.accessJwt, session.did, embed);
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

  async publishWorkout(accountId: bigint, payload: BlueskyWorkoutPayload): Promise<void> {
    try {
      if (!(await this.shouldPostWorkouts(accountId))) {
        return;
      }

      const postPayload = this.composeWorkoutPost(payload);
      if (!postPayload) {
        return;
      }

      await this.postUpdate(accountId, postPayload.text, postPayload.embed);
    } catch (error) {
      console.error('[bluesky] Failed to publish workout', {
        accountId: accountId.toString(),
        workoutId: payload.workoutId.toString(),
        error,
      });
    }
  }

  async publishAnnouncement(accountId: bigint, announcement: AnnouncementType): Promise<void> {
    try {
      if (!(await this.shouldPostAnnouncements(accountId))) {
        return;
      }

      const payload = await this.composeAnnouncementPost(accountId, announcement);
      if (!payload) {
        return;
      }

      await this.postUpdate(accountId, payload.text, payload.embed);
    } catch (error) {
      console.error('[bluesky] Failed to publish announcement', {
        accountId: accountId.toString(),
        announcementId: announcement.id,
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

    const postedAtRaw = post.record?.createdAt ?? post.indexedAt ?? new Date().toISOString();
    const postedAt = new Date(postedAtRaw);
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

  private async createPost(
    content: string,
    accessJwt: string,
    repo: string,
    embed?: BlueskyEmbed,
  ): Promise<string> {
    const record = {
      $type: 'app.bsky.feed.post',
      text: content,
      createdAt: new Date().toISOString(),
      ...(embed ? { embed } : {}),
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
    const account = await this.accountBlueskyCredentialsRepository.findByAccountId(accountId);

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    const handle = account.blueskyhandle?.trim();
    const appPassword = this.decryptSecretValue(account.blueskyapppassword)?.trim();

    if (!handle) {
      throw new ValidationError('Bluesky handle is not configured');
    }

    return {
      accountId: account.accountid,
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

  private async shouldPostWorkouts(accountId: bigint): Promise<boolean> {
    const settings = await this.accountSettingsService.getAccountSettings(accountId);
    const postWorkoutsSetting = settings.find(
      (setting) => setting.definition.key === 'PostWorkoutsToBluesky',
    );
    return Boolean(postWorkoutsSetting?.effectiveValue);
  }

  private async shouldPostAnnouncements(accountId: bigint): Promise<boolean> {
    const settings = await this.accountSettingsService.getAccountSettings(accountId);
    const postAnnouncementsSetting = settings.find(
      (setting) => setting.definition.key === 'PostAnnouncementsToBluesky',
    );
    return Boolean(postAnnouncementsSetting?.effectiveValue);
  }

  private composeGameResultPost(payload: BlueskyGameResultPayload): string | null {
    return composeGameResultMessage(payload, { characterLimit: 300 });
  }

  private composeWorkoutPost(payload: BlueskyWorkoutPayload): BlueskyPostPayload | null {
    // Reuse existing formatter but omit inline link; keep character budget for text only.
    const text =
      composeWorkoutAnnouncementMessage(
        { ...payload, workoutUrl: undefined },
        { characterLimit: 300 },
      ) ??
      payload.workoutDesc?.trim() ??
      'Workout update';

    const workoutUrl = payload.workoutUrl?.trim();
    const heading =
      [payload.accountName?.trim(), payload.workoutDesc?.trim()].filter(Boolean).join(' • ') ||
      payload.workoutDesc?.trim() ||
      'Workout details';
    const when = payload.workoutDate ? this.formatWorkoutDateTime(payload.workoutDate) : null;

    const embed: BlueskyEmbed | undefined = workoutUrl
      ? {
          $type: 'app.bsky.embed.external',
          external: {
            uri: workoutUrl,
            title: heading,
            description: this.truncateDescription(
              [when ? `When: ${when}` : '', payload.accountName?.trim()]
                .filter(Boolean)
                .join(' • '),
              200,
            ),
          },
        }
      : undefined;

    return { text, embed };
  }

  private async composeAnnouncementPost(
    accountId: bigint,
    announcement: AnnouncementType,
  ): Promise<BlueskyPostPayload | null> {
    const title = announcement.title?.trim();
    const body = stripHtml(announcement.body ?? '').trim();
    const announcementUrl = await this.buildAnnouncementUrl(accountId);
    const baseText = [title, body].filter(Boolean).join(': ').trim();

    if (!baseText && !announcementUrl) {
      return null;
    }

    const maxChars = 300;
    const ellipsis = '…';
    const text =
      baseText.length > maxChars
        ? `${baseText.slice(0, Math.max(maxChars - ellipsis.length, 0))}${ellipsis}`
        : baseText;

    const embed: BlueskyEmbed | undefined = announcementUrl
      ? {
          $type: 'app.bsky.embed.external',
          external: {
            uri: announcementUrl,
            title: title || 'View announcement',
            description: this.truncateDescription(body || baseText, 200),
          },
        }
      : undefined;

    return { text, embed };
  }

  private truncateDescription(value: string, max: number): string | undefined {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    if (trimmed.length <= max) {
      return trimmed;
    }
    return `${trimmed.slice(0, Math.max(max - 1, 0))}…`;
  }

  private formatWorkoutDateTime(value?: Date | null): string | null {
    if (!value) {
      return null;
    }

    return value.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  private async buildAnnouncementUrl(accountId: bigint): Promise<string> {
    const baseUrl = await resolveAccountFrontendBaseUrl(accountId);
    return `${baseUrl}/account/${accountId.toString()}/announcements`;
  }
}
