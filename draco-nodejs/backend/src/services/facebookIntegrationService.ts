import { AnnouncementType } from '@draco/shared-schemas';
import { createHmac } from 'node:crypto';
import {
  composeGameResultMessage,
  type GameResultPostPayload,
} from './socialGameResultFormatter.js';
import {
  composeWorkoutAnnouncementMessage,
  type WorkoutPostPayload,
} from './socialWorkoutFormatter.js';
import { stripHtml } from '../utils/emailContent.js';
import { facebookOAuthConfig } from '../config/facebookOAuth.js';
import { ServiceFactory } from '../services/serviceFactory.js';
import { RepositoryFactory } from '../repositories/repositoryFactory.js';
import { ValidationError } from '../utils/customErrors.js';
import { encryptSecret, decryptSecret } from '../utils/secretEncryption.js';
import { fetchJson, HttpError } from '../utils/fetchJson.js';
import { resolveAccountFrontendBaseUrl } from '../utils/frontendBaseUrl.js';

interface FacebookOAuthStatePayload {
  accountId: string;
  returnUrl?: string | null;
}

interface FacebookAccessTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
}

interface FacebookPageResponse {
  data?: Array<{ id?: string; name?: string; access_token?: string }>;
}

export class FacebookIntegrationService {
  private static readonly FACEBOOK_MESSAGE_CHARACTER_LIMIT = 10_000;
  private readonly accountSettingsService = ServiceFactory.getAccountSettingsService();
  private readonly credentialsRepository =
    RepositoryFactory.getAccountFacebookCredentialsRepository();

  async saveAppCredentials(
    accountId: bigint,
    payload: { appId?: string; appSecret?: string; clearCredentials?: boolean },
  ): Promise<void> {
    const appId = payload.appId?.trim();
    const appSecret = payload.appSecret?.trim();
    const clear = payload.clearCredentials === true;

    if (!clear && !appId && !appSecret) {
      throw new ValidationError('Provide an App ID, App Secret, or enable clear credentials.');
    }

    await this.credentialsRepository.upsertForAccount(accountId, {
      appid: clear ? null : (appId ?? undefined),
      appsecret: clear ? null : appSecret ? encryptSecret(appSecret) : undefined,
      useraccesstoken: clear ? null : undefined,
      useraccesstokenexpiresat: clear ? null : undefined,
      pagetoken: clear ? null : undefined,
      pageid: clear ? null : undefined,
      pagename: clear ? null : undefined,
    });
  }

  async createAuthorizationUrl(accountId: bigint, returnUrl?: string): Promise<string> {
    const { appId, callbackUrl } = await this.getAppCredentials(accountId);
    const statePayload: FacebookOAuthStatePayload = {
      accountId: accountId.toString(),
      returnUrl: returnUrl?.trim() || null,
    };
    const state = encryptSecret(JSON.stringify(statePayload));

    const url = new URL('https://www.facebook.com/v19.0/dialog/oauth');
    url.searchParams.set('client_id', appId);
    url.searchParams.set('redirect_uri', callbackUrl);
    url.searchParams.set('scope', facebookOAuthConfig.scopes);
    url.searchParams.set('state', state);

    return url.toString();
  }

  async completeOAuthCallback(
    code: string,
    state: string,
  ): Promise<{ accountId: bigint; redirectUrl: string }> {
    const payload = this.decryptOAuthState(state);
    const accountId = BigInt(payload.accountId);
    const { appId, appSecret, callbackUrl } = await this.getAppCredentials(accountId);

    const shortLived = await this.exchangeCodeForToken({
      appId,
      appSecret,
      code,
      redirectUri: callbackUrl,
    });

    if (!shortLived.access_token) {
      throw new ValidationError('Facebook did not return an access token');
    }

    const longLived = await this.exchangeForLongLivedUserToken({
      appId,
      appSecret,
      shortLivedToken: shortLived.access_token,
    });

    const userAccessToken = longLived.access_token ?? shortLived.access_token;
    const expiresAt =
      longLived.expires_in !== undefined && longLived.expires_in !== null
        ? new Date(Date.now() + longLived.expires_in * 1000)
        : null;

    await this.credentialsRepository.upsertForAccount(accountId, {
      appid: appId,
      appsecret: appSecret ? encryptSecret(appSecret) : null,
      useraccesstoken: encryptSecret(userAccessToken),
      useraccesstokenexpiresat: expiresAt,
    });

    return {
      accountId,
      redirectUrl: this.buildResultUrl(accountId, 'success', undefined, payload.returnUrl ?? null),
    };
  }

  async listPages(accountId: bigint): Promise<Array<{ id: string; name: string }>> {
    const credentials = await this.getAccountCredentials(accountId);
    const pages = await this.fetchPages({
      userAccessToken: credentials.userAccessToken,
      appSecret: credentials.appSecret,
    });
    return pages.map((page) => ({ id: page.id, name: page.name }));
  }

  async getConnectionStatus(accountId: bigint): Promise<{
    appConfigured: boolean;
    pageConnected: boolean;
    pageId?: string | null;
    pageName?: string | null;
  }> {
    const record = await this.credentialsRepository.findByAccountId(accountId);

    const appConfigured = Boolean(record?.appid?.trim() && record?.appsecret);
    const pageConnected = Boolean(record?.pageid?.trim());

    return {
      appConfigured,
      pageConnected,
      pageId: record?.pageid ?? null,
      pageName: record?.pagename ?? null,
    };
  }

  async savePageSelection(accountId: bigint, pageId: string, pageName: string): Promise<void> {
    const credentials = await this.getAccountCredentials(accountId);
    const pages = await this.fetchPages({
      userAccessToken: credentials.userAccessToken,
      appSecret: credentials.appSecret,
    });
    const selected = pages.find((page) => page.id === pageId);

    if (!selected?.access_token) {
      throw new ValidationError('Selected Facebook page could not be resolved or has no token');
    }

    await this.credentialsRepository.upsertForAccount(accountId, {
      accountid: accountId,
      pageid: pageId,
      pagename: pageName,
      pagetoken: encryptSecret(selected.access_token),
    });
  }

  async disconnect(accountId: bigint): Promise<void> {
    await this.credentialsRepository.deleteByAccountId(accountId);
  }

  async publishGameResult(accountId: bigint, payload: GameResultPostPayload): Promise<void> {
    try {
      if (!(await this.shouldPostGameResults(accountId))) {
        return;
      }

      const message = composeGameResultMessage(payload, { characterLimit: 2000 });
      if (!message) {
        return;
      }

      await this.postToFacebook(accountId, message, {
        context: 'gameResult',
        resourceId: payload.gameId.toString(),
      });
    } catch (error) {
      console.error('[facebook] Failed to publish game result', {
        accountId: accountId.toString(),
        gameId: payload.gameId.toString(),
        error,
      });
    }
  }

  async publishAnnouncement(accountId: bigint, announcement: AnnouncementType): Promise<void> {
    try {
      if (!(await this.shouldPostAnnouncements(accountId))) {
        return;
      }

      const message = await this.composeAnnouncement(accountId, announcement);
      if (!message) {
        return;
      }

      await this.postToFacebook(accountId, message, {
        context: 'announcement',
        resourceId: announcement.id?.toString(),
      });
    } catch (error) {
      console.error('[facebook] Failed to publish announcement', {
        accountId: accountId.toString(),
        announcementId: announcement.id,
        error,
      });
    }
  }

  async publishWorkout(accountId: bigint, payload: WorkoutPostPayload): Promise<void> {
    try {
      if (!(await this.shouldPostWorkouts(accountId))) {
        return;
      }

      const message = composeWorkoutAnnouncementMessage(payload, {
        characterLimit: FacebookIntegrationService.FACEBOOK_MESSAGE_CHARACTER_LIMIT,
      });
      if (!message) {
        return;
      }

      await this.postToFacebook(accountId, message, {
        context: 'workout',
        resourceId: payload.workoutId.toString(),
      });
    } catch (error) {
      console.error('[facebook] Failed to publish workout', {
        accountId: accountId.toString(),
        workoutId: payload.workoutId.toString(),
        error,
      });
    }
  }

  private async shouldPostGameResults(accountId: bigint): Promise<boolean> {
    const settings = await this.accountSettingsService.getAccountSettings(accountId);
    const setting = settings.find((item) => item.definition.key === 'PostGameResultsToFacebook');
    return Boolean(setting?.effectiveValue);
  }

  private async shouldPostAnnouncements(accountId: bigint): Promise<boolean> {
    const settings = await this.accountSettingsService.getAccountSettings(accountId);
    const setting = settings.find((item) => item.definition.key === 'PostAnnouncementsToFacebook');
    return Boolean(setting?.effectiveValue);
  }

  private async shouldPostWorkouts(accountId: bigint): Promise<boolean> {
    const settings = await this.accountSettingsService.getAccountSettings(accountId);
    const setting = settings.find((item) => item.definition.key === 'PostWorkoutsToFacebook');
    return Boolean(setting?.effectiveValue);
  }

  private async composeAnnouncement(
    accountId: bigint,
    announcement: AnnouncementType,
  ): Promise<string | null> {
    const title = announcement.title?.trim();
    const body = stripHtml(announcement.body ?? '').trim();
    const url = await this.buildAnnouncementUrl(accountId);

    const pieces = [title, body].filter(Boolean).join(': ').trim();
    const message = [pieces, url].filter(Boolean).join(' ').trim();

    if (!message) {
      return null;
    }

    return this.truncateMessage(
      message,
      FacebookIntegrationService.FACEBOOK_MESSAGE_CHARACTER_LIMIT,
    );
  }

  private async buildAnnouncementUrl(accountId: bigint): Promise<string> {
    const baseUrl = await resolveAccountFrontendBaseUrl(accountId);
    return `${baseUrl}/account/${accountId.toString()}/announcements`;
  }

  private async postToFacebook(
    accountId: bigint,
    message: string,
    context: { context: string; resourceId?: string },
  ): Promise<void> {
    const credentials = await this.getAccountCredentials(accountId);

    if (!credentials.pageId) {
      throw new ValidationError('Facebook page is not connected for this account');
    }

    const pageToken = await this.ensurePageToken(credentials);
    if (!pageToken) {
      throw new ValidationError('Facebook page token is not available');
    }

    const url = new URL(
      `https://graph.facebook.com/v19.0/${encodeURIComponent(credentials.pageId)}/feed`,
    );
    const body = new URLSearchParams({
      message,
      access_token: pageToken,
    });
    const postSecretProof = this.buildAppSecretProof(pageToken, credentials.appSecret);
    if (postSecretProof) {
      body.set('appsecret_proof', postSecretProof);
    }

    try {
      await fetchJson(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        timeoutMs: 8000,
      });
    } catch (error) {
      if (error instanceof HttpError) {
        console.error('[facebook] Graph API rejected post', {
          status: error.status,
          body: error.body,
          accountId: accountId.toString(),
          context,
        });
        throw new ValidationError('Facebook rejected the post request');
      }
      throw error;
    }
  }

  private async ensurePageToken(credentials: {
    accountId: bigint;
    appId?: string | null;
    appSecret?: string | null;
    userAccessToken: string;
    userAccessTokenExpiresAt?: Date | null;
    pageId?: string | null;
    pageToken?: string | null;
  }): Promise<string | null> {
    const token = credentials.pageToken?.trim();
    if (token) {
      return token;
    }

    if (!credentials.pageId) {
      return null;
    }

    const pages = await this.fetchPages({
      userAccessToken: credentials.userAccessToken,
      appSecret: credentials.appSecret,
    });
    const match = pages.find((page) => page.id === credentials.pageId && page.access_token);
    if (!match?.access_token) {
      return null;
    }

    await this.credentialsRepository.upsertForAccount(credentials.accountId, {
      pagetoken: encryptSecret(match.access_token),
    });

    return match.access_token;
  }

  private async fetchPages(params: {
    userAccessToken: string;
    appSecret?: string | null;
  }): Promise<Array<{ id: string; name: string; access_token?: string }>> {
    const url = new URL('https://graph.facebook.com/v19.0/me/accounts');
    url.searchParams.set('access_token', params.userAccessToken);
    url.searchParams.set('fields', 'id,name,access_token');
    const appSecretProof = this.buildAppSecretProof(params.userAccessToken, params.appSecret);
    if (appSecretProof) {
      url.searchParams.set('appsecret_proof', appSecretProof);
    }

    const response = await fetchJson<FacebookPageResponse>(url, { timeoutMs: 8000 });
    const pages = response.data ?? [];
    return pages
      .map((page) => ({
        id: page.id ?? '',
        name: page.name ?? '',
        access_token: page.access_token,
      }))
      .filter((page) => page.id && page.name);
  }

  private decryptOAuthState(state: string): FacebookOAuthStatePayload {
    try {
      const decoded = decryptSecret(state);
      const payload = JSON.parse(decoded) as FacebookOAuthStatePayload;
      if (!payload.accountId) {
        throw new ValidationError('Invalid Facebook OAuth state payload');
      }
      return payload;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Invalid Facebook OAuth state');
    }
  }

  private async getAccountCredentials(accountId: bigint): Promise<{
    accountId: bigint;
    appId?: string | null;
    appSecret?: string | null;
    userAccessToken: string;
    userAccessTokenExpiresAt?: Date | null;
    pageId?: string | null;
    pageName?: string | null;
    pageToken?: string | null;
  }> {
    const record = await this.credentialsRepository.findByAccountId(accountId);
    if (!record?.useraccesstoken) {
      throw new ValidationError('Facebook is not connected for this account');
    }

    const userAccessToken = this.decryptSecretValue(record.useraccesstoken);
    if (!userAccessToken) {
      throw new ValidationError('Facebook user token is not available');
    }

    return {
      accountId,
      appId: record.appid,
      appSecret: this.decryptSecretValue(record.appsecret),
      userAccessToken,
      userAccessTokenExpiresAt: record.useraccesstokenexpiresat ?? null,
      pageId: record.pageid ?? null,
      pageName: record.pagename ?? null,
      pageToken: this.decryptSecretValue(record.pagetoken),
    };
  }

  private async getAppCredentials(
    accountId: bigint,
  ): Promise<{ appId: string; appSecret: string; callbackUrl: string }> {
    const record = await this.credentialsRepository.findByAccountId(accountId);
    const appId = record?.appid?.trim();
    const appSecret = this.decryptSecretValue(record?.appsecret)?.trim();
    const callbackUrl = facebookOAuthConfig.callbackUrl?.trim();

    if (!appId || !appSecret || !callbackUrl) {
      throw new ValidationError('Facebook app credentials are not configured for this account');
    }

    return { appId, appSecret, callbackUrl };
  }

  private buildResultUrl(
    accountId: bigint,
    status: 'success' | 'error',
    message?: string,
    returnUrl?: string | null,
  ): string {
    const base =
      returnUrl?.trim() ||
      facebookOAuthConfig.resultUrlTemplate.replace('{accountId}', accountId.toString());
    const url = new URL(base);
    url.searchParams.set('facebookAuth', status);
    if (message) {
      url.searchParams.set('message', message);
    }
    return url.toString();
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

  private async exchangeCodeForToken(params: {
    appId: string;
    appSecret: string;
    code: string;
    redirectUri: string;
  }): Promise<FacebookAccessTokenResponse> {
    const url = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    url.searchParams.set('client_id', params.appId);
    url.searchParams.set('client_secret', params.appSecret);
    url.searchParams.set('redirect_uri', params.redirectUri);
    url.searchParams.set('code', params.code);

    try {
      return await fetchJson<FacebookAccessTokenResponse>(url, { timeoutMs: 8000 });
    } catch (error) {
      if (error instanceof HttpError) {
        console.error('[facebook] OAuth code exchange failed', {
          status: error.status,
          body: error.body,
        });
        throw new ValidationError('Facebook rejected the OAuth token exchange');
      }
      throw error;
    }
  }

  private async exchangeForLongLivedUserToken(params: {
    appId: string;
    appSecret: string;
    shortLivedToken: string;
  }): Promise<FacebookAccessTokenResponse> {
    const url = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    url.searchParams.set('grant_type', 'fb_exchange_token');
    url.searchParams.set('client_id', params.appId);
    url.searchParams.set('client_secret', params.appSecret);
    url.searchParams.set('fb_exchange_token', params.shortLivedToken);

    try {
      return await fetchJson<FacebookAccessTokenResponse>(url, { timeoutMs: 8000 });
    } catch (error) {
      if (error instanceof HttpError) {
        console.error('[facebook] Failed to exchange for long-lived token', {
          status: error.status,
          body: error.body,
        });
        throw new ValidationError('Facebook rejected the token exchange');
      }
      throw error;
    }
  }

  private truncateMessage(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
      return value;
    }

    if (maxLength <= 1) {
      return value.slice(0, maxLength);
    }

    return `${value.slice(0, maxLength - 1)}…`;
  }

  private buildAppSecretProof(token: string, appSecret?: string | null): string | null {
    if (!token || !appSecret) {
      return null;
    }

    return createHmac('sha256', appSecret).update(token).digest('hex');
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
}
