import { randomBytes } from 'node:crypto';
import type { accountdiscordsettings } from '@prisma/client';
import {
  DiscordAccountConfigType,
  DiscordAccountConfigUpdateType,
  DiscordLinkStatusType,
  DiscordOAuthCallbackType,
  DiscordOAuthStartResponseType,
  DiscordRoleMappingListType,
  DiscordRoleMappingType,
  DiscordRoleMappingUpdateType,
} from '@draco/shared-schemas';
import { RepositoryFactory } from '../repositories/index.js';
import { DiscordIntegrationResponseFormatter } from '../responseFormatters/index.js';
import { encryptSecret, decryptSecret } from '../utils/secretEncryption.js';
import { ConflictError, NotFoundError, ValidationError } from '../utils/customErrors.js';
import { getDiscordOAuthConfig, type DiscordOAuthConfig } from '../config/discordIntegration.js';
import { fetchJson } from '../utils/fetchJson.js';

interface DiscordLinkStatePayload {
  accountId: string;
  userId: string;
  expiresAt: string;
  nonce: string;
}

interface DiscordTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface DiscordUserResponse {
  id: string;
  username: string;
  discriminator?: string | null;
  global_name?: string | null;
  avatar?: string | null;
}

export class DiscordIntegrationService {
  private readonly discordRepository = RepositoryFactory.getDiscordIntegrationRepository();
  private readonly accountRepository = RepositoryFactory.getAccountRepository();

  async getAccountConfig(accountId: bigint): Promise<DiscordAccountConfigType> {
    await this.ensureAccountExists(accountId);
    const config = await this.getOrCreateAccountConfigRecord(accountId);
    return DiscordIntegrationResponseFormatter.formatAccountConfig(config);
  }

  async updateAccountConfig(
    accountId: bigint,
    payload: DiscordAccountConfigUpdateType,
  ): Promise<DiscordAccountConfigType> {
    await this.ensureAccountExists(accountId);

    const updateData = {
      guildId: payload.guildId ?? null,
      guildName: null as string | null,
      botUserId: null as string | null,
      botUserName: null as string | null,
      roleSyncEnabled:
        typeof payload.roleSyncEnabled === 'boolean' ? payload.roleSyncEnabled : undefined,
      botTokenEncrypted:
        payload.botToken !== undefined
          ? payload.botToken === null
            ? null
            : encryptSecret(payload.botToken)
          : undefined,
    };

    const updated = await this.discordRepository.updateAccountConfig(accountId, updateData);
    return DiscordIntegrationResponseFormatter.formatAccountConfig(updated);
  }

  async listRoleMappings(accountId: bigint): Promise<DiscordRoleMappingListType> {
    await this.ensureAccountExists(accountId);
    const mappings = await this.discordRepository.listRoleMappings(accountId);
    return DiscordIntegrationResponseFormatter.formatRoleMappingList(mappings);
  }

  async createRoleMapping(
    accountId: bigint,
    payload: DiscordRoleMappingUpdateType,
  ): Promise<DiscordRoleMappingType> {
    await this.ensureAccountExists(accountId);
    this.ensurePermissionsArray(payload.permissions);

    const existing = await this.discordRepository.findRoleMappingByRoleId(
      accountId,
      payload.discordRoleId,
    );

    if (existing) {
      throw new ConflictError('A mapping for this Discord role already exists.');
    }

    const created = await this.discordRepository.createRoleMapping(accountId, payload);
    return DiscordIntegrationResponseFormatter.formatRoleMapping(created);
  }

  async updateRoleMapping(
    accountId: bigint,
    roleMappingId: bigint,
    payload: DiscordRoleMappingUpdateType,
  ): Promise<DiscordRoleMappingType> {
    await this.ensureAccountExists(accountId);
    this.ensurePermissionsArray(payload.permissions);

    const mapping = await this.discordRepository.findRoleMappingById(accountId, roleMappingId);
    if (!mapping) {
      throw new NotFoundError('Role mapping not found');
    }

    const duplicate = await this.discordRepository.findRoleMappingByRoleId(
      accountId,
      payload.discordRoleId,
    );

    if (duplicate && duplicate.id !== roleMappingId) {
      throw new ConflictError('A mapping for this Discord role already exists.');
    }

    const updated = await this.discordRepository.updateRoleMapping(roleMappingId, payload);
    return DiscordIntegrationResponseFormatter.formatRoleMapping(updated);
  }

  async deleteRoleMapping(accountId: bigint, roleMappingId: bigint): Promise<void> {
    await this.ensureAccountExists(accountId);
    const mapping = await this.discordRepository.findRoleMappingById(accountId, roleMappingId);
    if (!mapping) {
      throw new NotFoundError('Role mapping not found');
    }
    await this.discordRepository.deleteRoleMapping(roleMappingId);
  }

  async getLinkStatus(accountId: bigint, userId: string): Promise<DiscordLinkStatusType> {
    await this.ensureAccountExists(accountId);
    const config = await this.getOrCreateAccountConfigRecord(accountId);
    const linkingEnabled = this.isLinkingEnabled(config);
    const record = await this.discordRepository.findLinkedAccount(accountId, userId);
    return DiscordIntegrationResponseFormatter.formatLinkStatus(record, linkingEnabled);
  }

  async startLink(accountId: bigint, userId: string): Promise<DiscordOAuthStartResponseType> {
    await this.ensureAccountExists(accountId);
    const config = await this.getOrCreateAccountConfigRecord(accountId);
    this.ensureAccountConfigSupportsLinking(config);
    const oauthConfig = getDiscordOAuthConfig();

    const { state, expiresAt } = this.createLinkState(accountId, userId, oauthConfig.stateTtlMs);
    const params = new URLSearchParams({
      client_id: oauthConfig.clientId,
      response_type: 'code',
      redirect_uri: oauthConfig.redirectUri,
      scope: oauthConfig.scope,
      state,
      prompt: 'consent',
      access_type: 'offline',
    });

    const authorizationUrl = `${oauthConfig.authorizeUrl}?${params.toString()}`;

    return {
      authorizationUrl,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async completeLink(
    accountId: bigint,
    userId: string,
    payload: DiscordOAuthCallbackType,
  ): Promise<DiscordLinkStatusType> {
    await this.ensureAccountExists(accountId);
    const config = await this.getOrCreateAccountConfigRecord(accountId);
    this.ensureAccountConfigSupportsLinking(config);
    const oauthConfig = getDiscordOAuthConfig();

    const statePayload = this.parseLinkState(payload.state);
    if (statePayload.accountId !== accountId.toString() || statePayload.userId !== userId) {
      throw new ValidationError('Discord OAuth state does not match this account.');
    }

    const expiresAt = new Date(statePayload.expiresAt);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
      throw new ValidationError('Discord OAuth state has expired. Please restart the flow.');
    }

    const tokenResponse = await this.exchangeAuthorizationCode(payload.code, oauthConfig);
    const discordUser = await this.fetchDiscordUser(tokenResponse.access_token, oauthConfig);

    const guildId = config.guildid;
    if (!guildId) {
      throw new ValidationError('Account Discord guild is not configured.');
    }

    const botToken = config.bottokenencrypted ? decryptSecret(config.bottokenencrypted) : null;
    if (!botToken) {
      throw new ValidationError('Discord bot token is missing for this account.');
    }

    let guildMember = await this.isUserGuildMember(
      guildId,
      tokenResponse.access_token,
      oauthConfig,
    );
    if (!guildMember) {
      guildMember = await this.addUserToGuild(
        guildId,
        discordUser.id,
        tokenResponse.access_token,
        botToken,
        oauthConfig,
      );
    }

    const record = await this.discordRepository.upsertLinkedAccount({
      accountId,
      userId,
      discordUserId: discordUser.id,
      username: discordUser.username ?? discordUser.global_name ?? null,
      discriminator: discordUser.discriminator ?? null,
      avatarUrl: this.buildAvatarUrl(discordUser),
      accessTokenEncrypted: encryptSecret(tokenResponse.access_token),
      refreshTokenEncrypted: tokenResponse.refresh_token
        ? encryptSecret(tokenResponse.refresh_token)
        : null,
      tokenExpiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
      guildMember,
      lastSyncedAt: new Date(),
    });

    const linkingEnabled = this.isLinkingEnabled(config);
    return DiscordIntegrationResponseFormatter.formatLinkStatus(record, linkingEnabled);
  }

  async unlinkAccount(accountId: bigint, userId: string): Promise<DiscordLinkStatusType> {
    await this.ensureAccountExists(accountId);
    const config = await this.getOrCreateAccountConfigRecord(accountId);
    const linkingEnabled = this.isLinkingEnabled(config);
    await this.discordRepository.deleteLinkedAccount(accountId, userId);
    return DiscordIntegrationResponseFormatter.formatLinkStatus(null, linkingEnabled);
  }

  private async ensureAccountExists(accountId: bigint): Promise<void> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new NotFoundError('Account not found');
    }
  }

  private async getOrCreateAccountConfigRecord(accountId: bigint): Promise<accountdiscordsettings> {
    let config = await this.discordRepository.getAccountConfig(accountId);
    if (!config) {
      config = await this.discordRepository.createAccountConfig(accountId);
    }
    return config;
  }

  private ensureAccountConfigSupportsLinking(config: accountdiscordsettings): void {
    if (!config.guildid) {
      throw new ValidationError(
        'Discord guild id is required before enabling user account linking.',
      );
    }

    if (!config.bottokenencrypted) {
      throw new ValidationError('Discord bot token must be configured for account linking.');
    }
  }

  private ensurePermissionsArray(permissions: string[]): void {
    if (!Array.isArray(permissions) || permissions.length === 0) {
      throw new ValidationError('At least one permission is required.');
    }
  }

  private isLinkingEnabled(config: accountdiscordsettings | null): boolean {
    if (!config) {
      return false;
    }
    return Boolean(config.guildid && config.bottokenencrypted);
  }

  private createLinkState(accountId: bigint, userId: string, ttlMs: number) {
    const expiresAt = new Date(Date.now() + ttlMs);
    const payload: DiscordLinkStatePayload = {
      accountId: accountId.toString(),
      userId,
      expiresAt: expiresAt.toISOString(),
      nonce: randomBytes(16).toString('hex'),
    };
    const state = encryptSecret(JSON.stringify(payload));
    return { state, expiresAt };
  }

  private parseLinkState(state: string): DiscordLinkStatePayload {
    try {
      const decoded = decryptSecret(state);
      const parsed = JSON.parse(decoded) as DiscordLinkStatePayload;
      if (!parsed.accountId || !parsed.userId || !parsed.expiresAt) {
        throw new Error('Missing fields');
      }
      return parsed;
    } catch (error) {
      console.error('Discord OAuth state parsing failed', error);
      throw new ValidationError('Invalid Discord OAuth state payload.');
    }
  }

  private async exchangeAuthorizationCode(
    code: string,
    oauthConfig: DiscordOAuthConfig,
  ): Promise<DiscordTokenResponse> {
    const body = new URLSearchParams({
      client_id: oauthConfig.clientId,
      client_secret: oauthConfig.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: oauthConfig.redirectUri,
    });

    try {
      return await fetchJson<DiscordTokenResponse>(oauthConfig.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
        timeoutMs: 10000,
      });
    } catch (error) {
      console.error('Discord token exchange failed', error);
      throw new ValidationError('Unable to authorize with Discord. Please try again.');
    }
  }

  private async fetchDiscordUser(
    accessToken: string,
    oauthConfig: DiscordOAuthConfig,
  ): Promise<DiscordUserResponse> {
    try {
      return await fetchJson<DiscordUserResponse>(`${oauthConfig.apiBaseUrl}/users/@me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeoutMs: 5000,
      });
    } catch (error) {
      console.error('Discord user fetch failed', error);
      throw new ValidationError('Unable to retrieve Discord profile information.');
    }
  }

  private async isUserGuildMember(
    guildId: string,
    accessToken: string,
    oauthConfig: DiscordOAuthConfig,
  ): Promise<boolean> {
    const response = await fetch(`${oauthConfig.apiBaseUrl}/users/@me/guilds/${guildId}/member`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.status === 404) {
      return false;
    }

    if (response.ok) {
      return true;
    }

    const message = await response.text().catch(() => response.statusText);
    console.error('Discord guild membership lookup failed', response.status, message);
    throw new ValidationError('Unable to verify Discord guild membership.');
  }

  private async addUserToGuild(
    guildId: string,
    discordUserId: string,
    accessToken: string,
    botToken: string,
    oauthConfig: DiscordOAuthConfig,
  ): Promise<boolean> {
    const response = await fetch(
      `${oauthConfig.apiBaseUrl}/guilds/${guildId}/members/${discordUserId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken,
        }),
      },
    );

    if (response.ok || response.status === 201 || response.status === 204) {
      return true;
    }

    const message = await response.text().catch(() => response.statusText);
    console.error('Discord guild join request failed', response.status, message);
    throw new ValidationError(
      'Unable to add Discord account to the guild, please contact an admin.',
    );
  }

  private buildAvatarUrl(user: DiscordUserResponse): string | null {
    if (!user.avatar) {
      return null;
    }

    const extension = user.avatar.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=256`;
  }
}
