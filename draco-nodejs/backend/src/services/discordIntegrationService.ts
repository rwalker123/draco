import { randomBytes } from 'node:crypto';
import type { accountdiscordsettings } from '@prisma/client';
import { z } from 'zod';
import {
  DiscordAccountConfigType,
  DiscordAccountConfigUpdateType,
  DiscordLinkStatusType,
  DiscordOAuthStartResponseType,
  DiscordRoleMappingListType,
  DiscordRoleMappingType,
  DiscordRoleMappingUpdateType,
  DiscordChannelMappingCreateType,
  DiscordChannelMappingType,
  DiscordChannelMappingListType,
  DiscordGuildChannelType,
  DiscordChannelCreateTypeEnum,
  CommunityChannelType,
} from '@draco/shared-schemas';
import { RepositoryFactory } from '../repositories/index.js';
import { DiscordIntegrationResponseFormatter } from '../responseFormatters/index.js';
import { encryptSecret, decryptSecret } from '../utils/secretEncryption.js';
import { ConflictError, NotFoundError, ValidationError } from '../utils/customErrors.js';
import { getDiscordOAuthConfig, type DiscordOAuthConfig } from '../config/discordIntegration.js';
import { fetchJson } from '../utils/fetchJson.js';
import type { DiscordIngestionTarget } from '../config/socialIngestion.js';

type DiscordLinkStatePayload =
  | {
      kind: 'user-link';
      accountId: string;
      userId: string;
      expiresAt: string;
      nonce: string;
    }
  | {
      kind: 'guild-install';
      accountId: string;
      userId: string;
      expiresAt: string;
      nonce: string;
    };

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

interface DiscordGuildResponse {
  id: string;
  name?: string;
}

interface DiscordGuildChannelResponse {
  id: string;
  name: string;
  type?: number;
}

interface CreatedDiscordChannel {
  id: string;
  name: string;
  type?: string;
}

type DiscordChannelCreateType = z.infer<typeof DiscordChannelCreateTypeEnum>;

export class DiscordIntegrationService {
  private readonly discordRepository = RepositoryFactory.getDiscordIntegrationRepository();
  private readonly accountRepository = RepositoryFactory.getAccountRepository();
  private readonly seasonsRepository = RepositoryFactory.getSeasonsRepository();
  private getBotToken(): string {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
      throw new ValidationError('Discord bot token is not configured.');
    }
    return token;
  }

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
    };

    const updated = await this.discordRepository.updateAccountConfig(accountId, updateData);
    return DiscordIntegrationResponseFormatter.formatAccountConfig(updated);
  }

  async listRoleMappings(accountId: bigint): Promise<DiscordRoleMappingListType> {
    await this.ensureAccountExists(accountId);
    const mappings = await this.discordRepository.listRoleMappings(accountId);
    return DiscordIntegrationResponseFormatter.formatRoleMappingList(mappings);
  }

  async listAvailableChannels(accountId: bigint): Promise<DiscordGuildChannelType[]> {
    await this.ensureAccountExists(accountId);
    const config = await this.getOrCreateAccountConfigRecord(accountId);
    this.ensureGuildConfigured(config);

    const channels = await this.fetchGuildChannels(config.guildid as string);
    const normalized = channels
      .filter((channel) => channel.type === undefined || channel.type === 0 || channel.type === 5)
      .map<DiscordGuildChannelType>((channel) => ({
        id: channel.id,
        name: channel.name,
        type: this.mapChannelType(channel.type),
      }));

    return DiscordIntegrationResponseFormatter.formatAvailableChannels(normalized);
  }

  async listChannelMappings(accountId: bigint): Promise<DiscordChannelMappingListType> {
    await this.ensureAccountExists(accountId);
    const mappings = await this.discordRepository.listChannelMappings(accountId);
    return DiscordIntegrationResponseFormatter.formatChannelMappingList(mappings);
  }

  async listCommunityChannels(
    accountId: bigint,
    seasonId: bigint,
  ): Promise<CommunityChannelType[]> {
    await this.ensureAccountExists(accountId);
    const config = await this.getOrCreateAccountConfigRecord(accountId);
    if (!config.guildid) {
      return [];
    }

    const mappings = await this.discordRepository.listChannelMappings(accountId);
    const filtered = mappings.filter((mapping) => {
      switch (mapping.scope) {
        case 'account':
          return true;
        case 'season':
          return mapping.seasonid === seasonId;
        case 'teamSeason':
        default:
          return false;
      }
    });

    const guildBaseUrl = `https://discord.com/channels/${config.guildid}`;

    return filtered.map((mapping) => ({
      id: mapping.id.toString(),
      accountId: mapping.accountid.toString(),
      seasonId: seasonId.toString(),
      discordChannelId: mapping.channelid,
      name: mapping.channelname,
      label: mapping.label ?? null,
      scope: mapping.scope as CommunityChannelType['scope'],
      channelType: mapping.channeltype ?? null,
      url: `${guildBaseUrl}/${mapping.channelid}`,
    }));
  }

  async createChannelMapping(
    accountId: bigint,
    payload: DiscordChannelMappingCreateType,
  ): Promise<DiscordChannelMappingType> {
    await this.ensureAccountExists(accountId);
    const config = await this.getOrCreateAccountConfigRecord(accountId);
    this.ensureGuildConfigured(config);

    const seasonId = payload.seasonId ? BigInt(payload.seasonId) : null;
    const teamSeasonId = payload.teamSeasonId ? BigInt(payload.teamSeasonId) : null;
    const teamId = payload.teamId ? BigInt(payload.teamId) : null;

    const requiresSeason = payload.scope === 'season' || payload.scope === 'teamSeason';
    if (requiresSeason && !seasonId) {
      throw new ValidationError('Season is required for this channel scope.');
    }

    if (payload.scope === 'teamSeason' && !teamSeasonId) {
      throw new ValidationError('Team season id is required when mapping a team channel.');
    }

    const { channelId, channelName, channelType } = await this.resolveChannelDetails(
      config,
      payload,
    );

    const existing = await this.discordRepository.listChannelMappings(accountId);
    const duplicate = existing.find(
      (mapping) =>
        mapping.channelid === channelId &&
        mapping.scope === payload.scope &&
        (mapping.seasonid ?? null) === (seasonId ?? null) &&
        (mapping.teamseasonid ?? null) === (teamSeasonId ?? null),
    );
    if (duplicate) {
      throw new ConflictError('A mapping for this channel and scope already exists.');
    }

    const created = await this.discordRepository.createChannelMapping(accountId, {
      discordChannelId: channelId,
      discordChannelName: channelName,
      channelType: channelType ?? null,
      label: payload.label ?? null,
      scope: payload.scope,
      seasonId,
      teamSeasonId,
      teamId,
    });

    return DiscordIntegrationResponseFormatter.formatChannelMapping(created);
  }

  async deleteChannelMapping(accountId: bigint, mappingId: bigint): Promise<void> {
    await this.ensureAccountExists(accountId);
    const mapping = await this.discordRepository.findChannelMappingById(accountId, mappingId);
    if (!mapping) {
      throw new NotFoundError('Channel mapping not found');
    }
    await this.discordRepository.deleteChannelMapping(accountId, mappingId);
  }

  async getChannelIngestionTargets(): Promise<DiscordIngestionTarget[]> {
    const mappings = await this.discordRepository.listAllChannelMappings();
    const targets: DiscordIngestionTarget[] = [];

    for (const mapping of mappings) {
      if (mapping.scope === 'account') {
        const currentSeason = await this.seasonsRepository.findCurrentSeason(mapping.accountid);
        if (!currentSeason) {
          console.warn(
            '[discord] Skipping account-scoped mapping because no current season is set',
            {
              accountId: mapping.accountid.toString(),
              channelId: mapping.channelid,
            },
          );
          continue;
        }

        targets.push({
          accountId: mapping.accountid,
          seasonId: currentSeason.id,
          teamSeasonId: undefined,
          teamId: undefined,
          channelId: mapping.channelid,
          label: mapping.label ?? undefined,
        });
        continue;
      }

      if (!mapping.seasonid) {
        console.warn('[discord] Skipping mapping without season id', {
          accountId: mapping.accountid.toString(),
          channelId: mapping.channelid,
          scope: mapping.scope,
        });
        continue;
      }

      targets.push({
        accountId: mapping.accountid,
        seasonId: mapping.seasonid as bigint,
        teamSeasonId: mapping.teamseasonid ?? undefined,
        teamId: mapping.teamid ?? undefined,
        channelId: mapping.channelid,
        label: mapping.label ?? undefined,
      });
    }

    return targets;
  }

  private async resolveChannelDetails(
    config: accountdiscordsettings,
    payload: DiscordChannelMappingCreateType,
  ): Promise<{ channelId: string; channelName: string; channelType?: string | null }> {
    if (payload.mode === 'autoCreate') {
      const guildId = config.guildid;
      if (!guildId) {
        throw new ValidationError('Discord guild id is required before creating channels.');
      }
      const createdChannel = await this.createDiscordChannel(
        guildId,
        payload.newChannelName,
        payload.newChannelType,
      );
      return {
        channelId: createdChannel.id,
        channelName: createdChannel.name,
        channelType: createdChannel.type ?? null,
      };
    }

    return {
      channelId: payload.discordChannelId,
      channelName: payload.discordChannelName,
      channelType: payload.channelType ?? null,
    };
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

    const { state, expiresAt } = this.createLinkState(
      accountId,
      userId,
      oauthConfig.stateTtlMs,
      'user-link',
    );
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

  async startGuildInstall(
    accountId: bigint,
    userId: string,
  ): Promise<DiscordOAuthStartResponseType> {
    await this.ensureAccountExists(accountId);
    const oauthConfig = getDiscordOAuthConfig();
    const { state, expiresAt } = this.createLinkState(
      accountId,
      userId,
      oauthConfig.stateTtlMs,
      'guild-install',
    );

    const params = new URLSearchParams({
      client_id: oauthConfig.clientId,
      response_type: 'code',
      redirect_uri: oauthConfig.installRedirectUri,
      scope: 'bot',
      permissions: oauthConfig.botPermissions,
      state,
    });

    const authorizationUrl = `${oauthConfig.authorizeUrl}?${params.toString()}`;

    return {
      authorizationUrl,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async completeUserLink(code: string, state: string): Promise<DiscordLinkStatusType> {
    const statePayload = this.parseLinkState(state);
    if (statePayload.kind !== 'user-link') {
      throw new ValidationError('Invalid Discord OAuth state payload.');
    }
    if (!statePayload.accountId || !statePayload.userId) {
      throw new ValidationError('Invalid Discord OAuth state payload.');
    }

    const accountId = BigInt(statePayload.accountId);
    const userId = statePayload.userId;

    await this.ensureAccountExists(accountId);
    const config = await this.getOrCreateAccountConfigRecord(accountId);
    this.ensureAccountConfigSupportsLinking(config);
    const oauthConfig = getDiscordOAuthConfig();

    const expiresAt = new Date(statePayload.expiresAt);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
      throw new ValidationError('Discord OAuth state has expired. Please restart the flow.');
    }

    const tokenResponse = await this.exchangeAuthorizationCode(code, oauthConfig);
    const discordUser = await this.fetchDiscordUser(tokenResponse.access_token, oauthConfig);

    const guildId = config.guildid;
    if (!guildId) {
      throw new ValidationError('Account Discord guild is not configured.');
    }

    const botToken = this.getBotToken();

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

  async completeGuildInstall(state: string, guildId?: string): Promise<void> {
    const statePayload = this.parseLinkState(state);
    if (statePayload.kind !== 'guild-install') {
      throw new ValidationError('Invalid Discord install state payload.');
    }

    if (!guildId) {
      throw new ValidationError('Discord did not return a guild id.');
    }

    const accountId = BigInt(statePayload.accountId);
    await this.ensureAccountExists(accountId);

    const guildName = await this.fetchGuildName(guildId);

    await this.discordRepository.updateAccountConfig(accountId, {
      guildId,
      guildName,
    });
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
    this.ensureGuildConfigured(config);
    this.getBotToken();
  }

  private ensureGuildConfigured(config: accountdiscordsettings): void {
    if (!config.guildid) {
      throw new ValidationError(
        'Discord guild id is required before enabling Discord integrations.',
      );
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
    return Boolean(config.guildid && process.env.DISCORD_BOT_TOKEN);
  }
  private createLinkState(
    accountId: bigint,
    userId: string,
    ttlMs: number,
    kind: DiscordLinkStatePayload['kind'],
  ) {
    const expiresAt = new Date(Date.now() + ttlMs);
    const payload: DiscordLinkStatePayload = {
      kind,
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

  private async fetchGuildName(guildId: string): Promise<string | null> {
    const botToken = this.getBotToken();
    try {
      const guild = await fetchJson<DiscordGuildResponse>(
        `${getDiscordOAuthConfig().apiBaseUrl}/guilds/${guildId}`,
        {
          headers: {
            Authorization: `Bot ${botToken}`,
          },
          timeoutMs: 5000,
        },
      );
      return guild.name ?? null;
    } catch (error) {
      console.warn('Unable to fetch Discord guild name', error);
      return null;
    }
  }

  private async fetchGuildChannels(guildId: string): Promise<DiscordGuildChannelResponse[]> {
    const botToken = this.getBotToken();
    try {
      return await fetchJson<DiscordGuildChannelResponse[]>(
        `${getDiscordOAuthConfig().apiBaseUrl}/guilds/${guildId}/channels`,
        {
          headers: {
            Authorization: `Bot ${botToken}`,
          },
          timeoutMs: 5000,
        },
      );
    } catch (error) {
      console.error('Unable to fetch Discord guild channels', error);
      throw new ValidationError('Unable to load Discord channels. Please try again later.');
    }
  }

  private async createDiscordChannel(
    guildId: string,
    channelName: string,
    channelType: DiscordChannelCreateType,
  ): Promise<CreatedDiscordChannel> {
    const botToken = this.getBotToken();
    const typeValue = channelType === 'announcement' ? 5 : 0;
    try {
      const channel = await fetchJson<DiscordGuildChannelResponse>(
        `${getDiscordOAuthConfig().apiBaseUrl}/guilds/${guildId}/channels`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bot ${botToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: channelName,
            type: typeValue,
          }),
          timeoutMs: 10000,
        },
      );

      return {
        id: channel.id,
        name: channel.name,
        type: this.mapChannelType(channel.type),
      };
    } catch (error) {
      console.error('Unable to create Discord channel', error);
      throw new ValidationError('Unable to create the Discord channel. Please try again.');
    }
  }

  private mapChannelType(type?: number): string | undefined {
    if (type === undefined || type === null) {
      return undefined;
    }
    switch (type) {
      case 0:
        return 'text';
      case 2:
        return 'voice';
      case 4:
        return 'category';
      case 5:
        return 'announcement';
      case 15:
        return 'forum';
      default:
        return String(type);
    }
  }
}
