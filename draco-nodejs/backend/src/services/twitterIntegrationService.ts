import crypto from 'node:crypto';
import { SocialFeedItemType, SocialMediaAttachmentType } from '@draco/shared-schemas';
import {
  RepositoryFactory,
  IAccountRepository,
  ISeasonsRepository,
  IAccountTwitterCredentialsRepository,
} from '../repositories/index.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import { decryptSecret, encryptSecret } from '../utils/secretEncryption.js';
import { fetchJson, HttpError } from '../utils/fetchJson.js';
import { deterministicUuid } from '../utils/deterministicUuid.js';
import { AccountSettingsService } from './accountSettingsService.js';
import { composeGameResultMessage } from './socialGameResultFormatter.js';
import type { TwitterIngestionTarget } from '../config/socialIngestion.js';
import { twitterOAuthConfig } from '../config/twitterOAuth.js';

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

interface TwitterTokenResponse {
  token_type?: string;
  access_token?: string;
  expires_in?: number;
  scope?: string;
  refresh_token?: string;
}

interface TwitterOAuthStatePayload {
  accountId: string;
  codeVerifier: string;
  returnUrl?: string | null;
}

interface AccountTwitterCredentials {
  accountId: bigint;
  handle: string;
  ingestionBearerToken?: string | null;
  clientId?: string | null;
  clientSecret?: string | null;
  userAccessToken?: string | null;
  userRefreshToken?: string | null;
  userAccessTokenExpiresAt?: Date | null;
  scope?: string | null;
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
  private readonly accountTwitterCredentialsRepository: IAccountTwitterCredentialsRepository;
  private readonly accountSettingsService = new AccountSettingsService();

  constructor(accountRepository?: IAccountRepository, seasonsRepository?: ISeasonsRepository) {
    this.accountRepository = accountRepository ?? RepositoryFactory.getAccountRepository();
    this.seasonsRepository = seasonsRepository ?? RepositoryFactory.getSeasonsRepository();
    this.accountTwitterCredentialsRepository =
      RepositoryFactory.getAccountTwitterCredentialsRepository();
  }

  async createAuthorizationUrl(accountId: bigint, returnUrl?: string): Promise<string> {
    const credentials = await this.accountTwitterCredentialsRepository.findByAccountId(accountId);

    if (!credentials?.clientid || !credentials.clientsecret) {
      throw new ValidationError('Twitter client credentials are not configured');
    }

    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.toCodeChallenge(codeVerifier);
    const statePayload: TwitterOAuthStatePayload = {
      accountId: accountId.toString(),
      codeVerifier,
      returnUrl: returnUrl?.trim() || null,
    };

    const state = encryptSecret(JSON.stringify(statePayload));

    const url = new URL('https://twitter.com/i/oauth2/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', credentials.clientid);
    url.searchParams.set('redirect_uri', twitterOAuthConfig.callbackUrl);
    url.searchParams.set('scope', twitterOAuthConfig.scopes);
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');

    return url.toString();
  }

  async completeOAuthCallback(
    code: string,
    state: string,
  ): Promise<{
    accountId: bigint;
    redirectUrl: string;
  }> {
    const { accountId, codeVerifier, returnUrl } = this.decryptOAuthState(state);

    const accountIdBigInt = BigInt(accountId);

    const credentials =
      await this.accountTwitterCredentialsRepository.findByAccountId(accountIdBigInt);

    if (!credentials?.clientid || !credentials.clientsecret) {
      throw new ValidationError('Twitter client credentials are not configured');
    }

    const clientSecret = this.decryptSecretValue(credentials.clientsecret);
    if (!clientSecret) {
      throw new ValidationError('Twitter client secret is not configured for this account');
    }

    const tokenResponse = await this.exchangeAuthorizationCode({
      code,
      codeVerifier,
      clientId: credentials.clientid,
      clientSecret,
    });

    if (!tokenResponse.access_token) {
      throw new ValidationError('Twitter did not return an access token');
    }

    const accessToken = tokenResponse.access_token;
    const refreshToken = tokenResponse.refresh_token;
    const expiresAt = tokenResponse.expires_in
      ? new Date(Date.now() + tokenResponse.expires_in * 1000)
      : null;

    if (!accessToken) {
      throw new ValidationError('Twitter did not return an access token');
    }

    const currentUser = await this.fetchCurrentUser(accessToken).catch((error) => {
      console.warn('[twitter] Failed to fetch user profile after OAuth', error);
      return null;
    });
    const derivedHandle = currentUser?.data?.username?.trim() ?? credentials.handle?.trim() ?? '';

    if (!derivedHandle) {
      throw new ValidationError(
        'Twitter handle could not be determined from OAuth response or existing credentials.',
      );
    }

    await this.accountTwitterCredentialsRepository.upsertForAccount(accountIdBigInt, {
      clientid: credentials.clientid,
      clientsecret: credentials.clientsecret,
      ingestionbearertoken: credentials.ingestionbearertoken,
      handle: derivedHandle,
      useraccesstoken: encryptSecret(accessToken),
      userrefreshtoken: refreshToken ? encryptSecret(refreshToken) : null,
      useraccesstokenexpiresat: expiresAt,
      scope: tokenResponse.scope ?? null,
    });

    return {
      accountId: accountIdBigInt,
      redirectUrl: this.buildResultUrl(accountIdBigInt, 'success', undefined, returnUrl),
    };
  }

  buildResultRedirect(
    accountId: bigint,
    status: 'success' | 'error',
    message?: string,
    returnUrl?: string | null,
  ): string {
    return this.buildResultUrl(accountId, status, message, returnUrl);
  }

  buildRedirectFromState(state: string | null, status: 'success' | 'error', message?: string) {
    if (!state) {
      return this.buildResultUrl(BigInt(0), status, message);
    }
    try {
      const payload = this.decryptOAuthState(state);
      return this.buildResultUrl(BigInt(payload.accountId), status, message, payload.returnUrl);
    } catch {
      return this.buildResultUrl(BigInt(0), status, message);
    }
  }

  async listIngestionTargets(): Promise<(TwitterIngestionTarget & { bearerToken: string })[]> {
    const credentials = await this.accountTwitterCredentialsRepository.findAllWithIngestionToken();

    const targets: Array<TwitterIngestionTarget & { bearerToken: string }> = [];

    for (const credential of credentials) {
      const season = await this.seasonsRepository.findCurrentSeason(credential.accountid);
      if (!season) {
        console.warn('[twitter] Skipping ingestion target because no current season is set', {
          accountId: credential.accountid.toString(),
        });
        continue;
      }

      const token = credential.ingestionbearertoken
        ? this.decryptSecretValue(credential.ingestionbearertoken)
        : null;
      if (!token) {
        console.warn('[twitter] Skipping ingestion target without bearer token', {
          accountId: credential.accountid.toString(),
        });
        continue;
      }

      if (!credential.handle?.trim()) {
        console.warn('[twitter] Skipping ingestion target without handle', {
          accountId: credential.accountid.toString(),
        });
        continue;
      }

      targets.push({
        accountId: credential.accountid,
        seasonId: season.id,
        handle: credential.handle.replace(/^@/, ''),
        bearerToken: token,
      });
    }

    return targets;
  }

  async listRecentTweets(accountId: bigint, limit = 5): Promise<SocialFeedItemType[]> {
    const credentials = await this.getAccountCredentials(accountId);
    const bearerToken = await this.resolveReadToken(credentials);

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
    const accessToken = await this.ensureValidUserAccessToken(credentials);

    const response = await this.createTweet(normalizedContent, accessToken);

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
    return composeGameResultMessage(payload, { characterLimit: 280 });
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
    const credentials = await this.accountTwitterCredentialsRepository.findByAccountId(accountId);

    if (!credentials) {
      throw new NotFoundError('Twitter credentials are not configured for this account');
    }

    const handle = credentials.handle?.trim();
    const ingestionBearerToken = credentials.ingestionbearertoken
      ? this.decryptSecretValue(credentials.ingestionbearertoken)?.trim()
      : null;
    const clientId = credentials.clientid?.trim() ?? null;
    const clientSecret = credentials.clientsecret
      ? this.decryptSecretValue(credentials.clientsecret)?.trim()
      : null;
    const userAccessToken = credentials.useraccesstoken
      ? this.decryptSecretValue(credentials.useraccesstoken)?.trim()
      : null;
    const userRefreshToken = credentials.userrefreshtoken
      ? this.decryptSecretValue(credentials.userrefreshtoken)?.trim()
      : null;

    if (!handle) {
      throw new ValidationError('Twitter account handle is not configured');
    }

    return {
      accountId: credentials.accountid,
      handle: handle.replace(/^@/, ''),
      ingestionBearerToken: ingestionBearerToken ?? null,
      clientId,
      clientSecret,
      userAccessToken,
      userRefreshToken,
      userAccessTokenExpiresAt: credentials.useraccesstokenexpiresat ?? null,
      scope: credentials.scope ?? null,
    };
  }

  private async resolveReadToken(credentials: AccountTwitterCredentials): Promise<string> {
    if (credentials.ingestionBearerToken) {
      return credentials.ingestionBearerToken;
    }

    if (credentials.userAccessToken) {
      return this.ensureValidUserAccessToken(credentials);
    }

    throw new ValidationError(
      'Twitter credentials are missing a bearer token or user access token',
    );
  }

  private async ensureValidUserAccessToken(
    credentials: AccountTwitterCredentials,
  ): Promise<string> {
    if (!credentials.userAccessToken) {
      throw new ValidationError('Twitter user access token is not configured for this account');
    }

    const expiresAt = credentials.userAccessTokenExpiresAt?.getTime();
    const now = Date.now();
    const nearExpiry = expiresAt ? expiresAt - now < 60_000 : false;

    if (!nearExpiry) {
      return credentials.userAccessToken;
    }

    if (!credentials.userRefreshToken || !credentials.clientId || !credentials.clientSecret) {
      console.warn(
        '[twitter] User access token is near expiry but refresh credentials are missing; proceeding with existing token.',
      );
      return credentials.userAccessToken;
    }

    const refreshed = await this.refreshUserAccessToken(credentials);
    if (!refreshed.access_token) {
      throw new Error(
        '[twitter] Failed to refresh user access token: no access_token returned from refresh endpoint.',
      );
    }
    const accessToken = refreshed.access_token;
    const refreshToken = refreshed.refresh_token ?? credentials.userRefreshToken;
    const expiresIn = refreshed.expires_in;
    let scope: string | null;
    if (typeof refreshed.scope === 'undefined' || refreshed.scope === null) {
      console.warn(
        `[twitter] Refresh response missing scope for account ${credentials.accountId}; falling back to previous scope: ${credentials.scope ?? 'none'}. This may indicate a scope mismatch if the OAuth app's permissions have changed.`,
      );
      scope = credentials.scope ?? null;
    } else {
      scope = refreshed.scope;
    }
    const nextExpiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

    await this.accountTwitterCredentialsRepository.upsertForAccount(credentials.accountId, {
      useraccesstoken: encryptSecret(accessToken),
      userrefreshtoken: refreshToken ? encryptSecret(refreshToken) : null,
      useraccesstokenexpiresat: nextExpiresAt,
      scope,
    });

    credentials.userAccessToken = accessToken;
    credentials.userRefreshToken = refreshToken;
    credentials.userAccessTokenExpiresAt = nextExpiresAt;
    credentials.scope = scope;

    return accessToken;
  }

  private async refreshUserAccessToken(credentials: AccountTwitterCredentials): Promise<{
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  }> {
    if (!credentials.clientId || !credentials.clientSecret) {
      throw new ValidationError('Twitter client credentials are not configured for refresh');
    }

    const payload = this.toFormEncoded({
      grant_type: 'refresh_token',
      refresh_token: credentials.userRefreshToken as string,
      client_id: credentials.clientId,
    });

    const basicAuth = Buffer.from(
      `${credentials.clientId}:${credentials.clientSecret}`,
      'utf8',
    ).toString('base64');

    return fetchJson('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload,
      timeoutMs: 8000,
    });
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
        console.error('Twitter API rejected tweet request', {
          message: error.message,
          status: error.status,
          body: error.body,
        });
        throw new ValidationError('Twitter rejected the tweet request');
      }

      throw error;
    }
  }

  private async fetchCurrentUser(
    accessToken: string,
  ): Promise<TwitterUserResponse | null | undefined> {
    try {
      return await fetchJson<TwitterUserResponse>('https://api.twitter.com/2/users/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeoutMs: 8000,
      });
    } catch (error) {
      if (error instanceof HttpError) {
        console.error('Twitter user profile lookup failed', {
          message: error.message,
          status: error.status,
          body: error.body,
        });
        return null;
      }
      throw error;
    }
  }

  private async exchangeAuthorizationCode(params: {
    code: string;
    codeVerifier: string;
    clientId: string;
    clientSecret: string;
  }): Promise<TwitterTokenResponse> {
    if (!params.clientId?.trim() || !params.clientSecret?.trim()) {
      throw new ValidationError('Twitter client credentials are not configured');
    }

    const payload = this.toFormEncoded({
      grant_type: 'authorization_code',
      code: params.code,
      redirect_uri: twitterOAuthConfig.callbackUrl,
      code_verifier: params.codeVerifier,
      client_id: params.clientId,
    });

    const basicAuth = Buffer.from(`${params.clientId}:${params.clientSecret}`, 'utf8').toString(
      'base64',
    );

    try {
      return await fetchJson('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: payload,
        timeoutMs: 8000,
      });
    } catch (error) {
      if (error instanceof HttpError) {
        console.error('[twitter] OAuth token exchange failed', {
          status: error.status,
          body: error.body,
          hasClientId: Boolean(params.clientId),
          redirectUri: twitterOAuthConfig.callbackUrl,
          scope: twitterOAuthConfig.scopes,
        });
        throw new ValidationError(
          'Twitter rejected the OAuth token exchange. Verify client ID/secret and callback URL match your Twitter app settings.',
        );
      }
      throw error;
    }
  }

  private decryptOAuthState(state: string): TwitterOAuthStatePayload {
    try {
      const decoded = decryptSecret(state);
      const payload = JSON.parse(decoded) as TwitterOAuthStatePayload;
      if (!payload.accountId || !payload.codeVerifier) {
        throw new ValidationError('Invalid OAuth state payload');
      }
      return payload;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Invalid OAuth state');
    }
  }

  private buildResultUrl(
    accountId: bigint,
    status: 'success' | 'error',
    message?: string,
    returnUrl?: string | null,
  ): string {
    const base =
      returnUrl?.trim() ||
      twitterOAuthConfig.resultUrlTemplate.replace('{accountId}', accountId.toString());
    const url = new URL(base);
    url.searchParams.set('twitterAuth', status);
    if (message) {
      url.searchParams.set('message', message);
    }
    return url.toString();
  }

  private generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  private toCodeChallenge(codeVerifier: string): string {
    return crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  }

  private toFormEncoded(data: Record<string, string | undefined>): string {
    return Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`)
      .join('&');
  }
}
