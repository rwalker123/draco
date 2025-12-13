import { accountfacebookcredentials } from '#prisma/client';
import { AnnouncementType } from '@draco/shared-schemas';
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

interface FacebookPageLookupResponse {
  id?: string;
  name?: string;
}

interface FacebookPageAccessTokenResponse {
  id?: string;
  name?: string;
  access_token?: string;
}

export class FacebookIntegrationService {
  private static readonly FACEBOOK_MESSAGE_CHARACTER_LIMIT = 10_000;
  private readonly accountSettingsService = ServiceFactory.getAccountSettingsService();
  private readonly credentialsRepository =
    RepositoryFactory.getAccountFacebookCredentialsRepository();

  async saveAppCredentials(
    accountId: bigint,
    payload: {
      appId?: string;
      appSecret?: string;
      clearCredentials?: boolean;
      pageHandle?: string;
    },
  ): Promise<void> {
    const appId = payload.appId?.trim();
    const appSecret = payload.appSecret?.trim();
    const pageHandle = payload.pageHandle?.trim();
    const clear = payload.clearCredentials === true;

    if (!clear && !appId && !appSecret && pageHandle === undefined) {
      throw new ValidationError(
        'Provide an App ID, App Secret, Page handle, or enable clear credentials.',
      );
    }

    const existing = await this.credentialsRepository.findByAccountId(accountId);

    if (clear) {
      await this.credentialsRepository.upsertForAccount(accountId, {
        appid: null,
        appsecret: null,
        useraccesstoken: null,
        useraccesstokenexpiresat: null,
        pagetoken: null,
        pageid: null,
        pagename: null,
        pagehandle: null,
      });
      return;
    }

    const updates: Partial<accountfacebookcredentials> = {};

    if (appId) {
      updates.appid = appId;
    }

    if (appSecret) {
      updates.appsecret = encryptSecret(appSecret);
    }

    if (pageHandle !== undefined) {
      const userAccessToken = this.decryptSecretValue(existing?.useraccesstoken);
      if (!userAccessToken) {
        throw new ValidationError('Connect Facebook before saving a Page handle.');
      }
      if (!pageHandle) {
        throw new ValidationError('Provide a Facebook Page handle before saving.');
      }

      const pageDetails = await this.resolvePageByHandle(pageHandle, userAccessToken);
      const pageAccessTokenResult = await this.fetchPageAccessToken(
        pageDetails.id,
        userAccessToken,
      );

      if (!pageAccessTokenResult.accessToken) {
        throw new ValidationError('Facebook did not return a Page access token for the handle.');
      }

      updates.pagehandle = pageHandle;
      updates.pageid = pageDetails.id;
      updates.pagename = pageAccessTokenResult.pageName ?? pageDetails.name;
      updates.pagetoken = encryptSecret(pageAccessTokenResult.accessToken);
    }

    await this.credentialsRepository.upsertForAccount(accountId, updates);
  }

  async createAuthorizationUrl(accountId: bigint, returnUrl?: string): Promise<string> {
    const { appId, callbackUrl } = await this.getAppCredentials(accountId);
    const statePayload: FacebookOAuthStatePayload = {
      accountId: accountId.toString(),
      returnUrl: returnUrl?.trim() || null,
    };
    const state = encryptSecret(JSON.stringify(statePayload));

    const url = new URL('https://www.facebook.com/v24.0/dialog/oauth');
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
      appId: credentials.appId,
      appSecret: credentials.appSecret,
    });
    return pages.map((page) => ({ id: page.id, name: page.name }));
  }

  async getConnectionStatus(accountId: bigint): Promise<{
    appConfigured: boolean;
    pageConnected: boolean;
    pageId?: string | null;
    pageName?: string | null;
    pageHandle?: string | null;
    userTokenPresent?: boolean;
  }> {
    const record = await this.credentialsRepository.findByAccountId(accountId);

    const appConfigured = Boolean(record?.appid?.trim() && record?.appsecret);
    const pageConnected = Boolean(record?.pageid?.trim());

    return {
      appConfigured,
      pageConnected,
      pageId: record?.pageid ?? null,
      pageName: record?.pagename ?? null,
      pageHandle: record?.pagehandle ?? null,
      userTokenPresent: Boolean(record?.useraccesstoken),
    };
  }

  async savePageSelection(accountId: bigint, pageId: string, pageName: string): Promise<void> {
    const credentials = await this.getAccountCredentials(accountId);
    const pages = await this.fetchPages({
      userAccessToken: credentials.userAccessToken,
      appId: credentials.appId,
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
    const record = await this.credentialsRepository.findByAccountId(accountId);
    if (!record) {
      return;
    }

    await this.credentialsRepository.upsertForAccount(accountId, {
      useraccesstoken: null,
      useraccesstokenexpiresat: null,
      pagetoken: null,
      pageid: null,
      pagename: null,
      pagehandle: null,
    });
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

    const pageAccess = await this.ensurePageAccess(credentials);

    const url = new URL(
      `https://graph.facebook.com/v24.0/${encodeURIComponent(pageAccess.pageId)}/feed`,
    );
    const body = new URLSearchParams({
      message,
      access_token: pageAccess.pageToken,
    });

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

  private async ensurePageAccess(credentials: {
    accountId: bigint;
    appId?: string | null;
    appSecret?: string | null;
    userAccessToken: string;
    userAccessTokenExpiresAt?: Date | null;
    pageId?: string | null;
    pageName?: string | null;
    pageHandle?: string | null;
    pageToken?: string | null;
  }): Promise<{ pageId: string; pageName: string | null; pageToken: string }> {
    const token = credentials.pageToken?.trim();
    if (token && credentials.pageId) {
      return {
        pageId: credentials.pageId,
        pageName: credentials.pageName ?? null,
        pageToken: token,
      };
    }

    const handle = credentials.pageHandle?.trim();
    const lookup = handle
      ? await this.resolvePageByHandle(handle, credentials.userAccessToken)
      : credentials.pageId
        ? { id: credentials.pageId, name: credentials.pageName ?? null }
        : null;

    if (!lookup) {
      throw new ValidationError('Facebook page handle is not configured for this account');
    }

    const pageTokenResult = await this.fetchPageAccessToken(lookup.id, credentials.userAccessToken);

    if (!pageTokenResult.accessToken) {
      throw new ValidationError('Facebook did not return a Page access token.');
    }

    const pageName = pageTokenResult.pageName ?? lookup.name ?? null;

    await this.credentialsRepository.upsertForAccount(credentials.accountId, {
      pageid: lookup.id,
      pagename: pageName,
      pagehandle: handle ?? null,
      pagetoken: encryptSecret(pageTokenResult.accessToken),
    });

    return {
      pageId: lookup.id,
      pageName,
      pageToken: pageTokenResult.accessToken,
    };
  }

  private async resolvePageByHandle(
    handle: string,
    userAccessToken: string,
  ): Promise<{ id: string; name: string | null }> {
    const url = new URL(`https://graph.facebook.com/v24.0/${encodeURIComponent(handle)}`);
    url.searchParams.set('fields', 'id,name');
    url.searchParams.set('access_token', userAccessToken);

    let response: FacebookPageLookupResponse;
    try {
      response = await fetchJson<FacebookPageLookupResponse>(url, { timeoutMs: 8000 });
    } catch (error) {
      if (error instanceof HttpError) {
        console.error('[facebook] Page handle lookup failed', {
          status: error.status,
          body: error.body,
          handle,
        });
        throw new ValidationError(
          'Facebook rejected the Page handle lookup. Verify the handle is correct, the page exists, and you have admin access to it.',
        );
      }
      throw error;
    }

    const id = response?.id?.toString() ?? '';
    const name = response?.name?.trim() ?? null;

    if (!id) {
      throw new ValidationError('Facebook page handle could not be resolved.');
    }

    return { id, name };
  }

  private async fetchPageAccessToken(
    pageId: string,
    userAccessToken: string,
  ): Promise<{ accessToken: string | null; pageName: string | null }> {
    const url = new URL(`https://graph.facebook.com/v24.0/${encodeURIComponent(pageId)}`);
    url.searchParams.set('fields', 'access_token,name');
    url.searchParams.set('access_token', userAccessToken);

    let response: FacebookPageAccessTokenResponse;
    try {
      response = await fetchJson<FacebookPageAccessTokenResponse>(url, { timeoutMs: 8000 });
    } catch (error) {
      if (error instanceof HttpError) {
        console.error('[facebook] Failed to fetch Page access token', {
          status: error.status,
          body: error.body,
          pageId,
        });
        throw new ValidationError(
          'Facebook rejected the Page token request. Ensure you have admin access to this page and the necessary permissions.',
        );
      }
      throw error;
    }
    const accessToken = response?.access_token ?? null;
    const pageName = response?.name?.trim() ?? null;

    return { accessToken, pageName };
  }

  private async fetchPages(params: {
    userAccessToken: string;
    appId?: string | null;
    appSecret?: string | null;
  }): Promise<Array<{ id: string; name: string; access_token?: string }>> {
    const url = new URL('https://graph.facebook.com/v24.0/me/accounts');
    url.searchParams.set('access_token', params.userAccessToken);
    url.searchParams.set('fields', 'id,name,access_token');

    const response = await fetchJson<FacebookPageResponse>(url, { timeoutMs: 8000 });
    const pages = response.data ?? [];
    if (process.env.NODE_ENV === 'development') {
      console.info('[facebook] Raw page response', {
        response,
      });
    }
    console.info('[facebook] Graph returned pages', {
      pageCount: pages.length,
      pages: pages.map((page) => ({
        id: page.id ?? null,
        namePresent: Boolean(page.name?.trim()),
        hasPageToken: Boolean(page.access_token),
      })),
    });
    return pages
      .map((page) => {
        const id = page.id ?? '';
        const rawName = page.name?.trim() ?? '';
        return {
          id,
          name: rawName || (id ? `Facebook Page ${id}` : ''),
          access_token: page.access_token,
        };
      })
      .filter((page) => page.id);
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
    pageHandle?: string | null;
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
      pageHandle: record.pagehandle ?? null,
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
    const url = new URL('https://graph.facebook.com/v24.0/oauth/access_token');
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
    const url = new URL('https://graph.facebook.com/v24.0/oauth/access_token');
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
