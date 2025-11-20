import { randomBytes } from 'node:crypto';
import type {
  accountdiscordsettings,
  accountdiscordchannels,
  accountdiscordteamforums,
} from '#prisma/client';
import { z } from 'zod';
import {
  AnnouncementType,
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
  DiscordFeatureSyncStatusType,
  DiscordFeatureSyncUpdateType,
  DiscordFeatureSyncFeatureType,
  DiscordFeatureSyncChannelType,
  CommunityChannelType,
  CommunityChannelQueryType,
  DiscordTeamForumListType,
  DiscordTeamForumQueryType,
  DiscordTeamForumRepairResultType,
  DiscordTeamForumCleanupModeEnum,
} from '@draco/shared-schemas';
import { RepositoryFactory } from '../repositories/index.js';
import type { DiscordAccountConfigUpsertInput } from '../repositories/interfaces/IDiscordIntegrationRepository.js';
import { DiscordIntegrationResponseFormatter } from '../responseFormatters/index.js';
import { encryptSecret, decryptSecret } from '../utils/secretEncryption.js';
import { ConflictError, NotFoundError, ValidationError } from '../utils/customErrors.js';
import { getDiscordOAuthConfig, type DiscordOAuthConfig } from '../config/discordIntegration.js';
import { fetchJson } from '../utils/fetchJson.js';
import type { dbTeamSeasonWithLeaguesAndTeams } from '../repositories/types/dbTypes.js';
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

type DiscordChannelCreateType = z.infer<typeof DiscordChannelCreateTypeEnum> | 'category';
type TeamForumCleanupMode = z.infer<typeof DiscordTeamForumCleanupModeEnum>;

const SUPPORTED_FEATURES: readonly DiscordFeatureSyncFeatureType[] = ['announcements'] as const;

export class DiscordIntegrationService {
  private readonly discordRepository = RepositoryFactory.getDiscordIntegrationRepository();
  private readonly accountRepository = RepositoryFactory.getAccountRepository();
  private readonly seasonsRepository = RepositoryFactory.getSeasonsRepository();
  private readonly teamRepository = RepositoryFactory.getTeamRepository();
  private channelIngestionTargetsCache: DiscordIngestionTarget[] | null = null;
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
    const existingConfig = await this.getOrCreateAccountConfigRecord(accountId);

    const updateData: DiscordAccountConfigUpsertInput = {
      roleSyncEnabled:
        typeof payload.roleSyncEnabled === 'boolean' ? payload.roleSyncEnabled : undefined,
      teamForumEnabled:
        typeof payload.teamForumEnabled === 'boolean' ? payload.teamForumEnabled : undefined,
    };

    if (payload.guildId !== undefined) {
      updateData.guildId = payload.guildId;
      updateData.guildName = null;
    }

    const enablingTeamForums =
      payload.teamForumEnabled === true && !existingConfig.teamforumenabled;
    const disablingTeamForums =
      payload.teamForumEnabled === false && Boolean(existingConfig.teamforumenabled);

    try {
      if (enablingTeamForums) {
        await this.syncTeamForums(accountId);
      } else if (disablingTeamForums) {
        const cleanupMode: TeamForumCleanupMode =
          (payload.teamForumCleanupMode as TeamForumCleanupMode | undefined) ?? 'retain';
        await this.disableTeamForums(accountId, cleanupMode);
      }
    } catch (error) {
      if (enablingTeamForums || disablingTeamForums) {
        await this.discordRepository.updateAccountConfig(accountId, {
          teamForumEnabled: existingConfig.teamforumenabled,
        });
      }
      throw error;
    }

    const refreshed = await this.getOrCreateAccountConfigRecord(accountId);
    return DiscordIntegrationResponseFormatter.formatAccountConfig(refreshed);
  }

  async disconnectAccountGuild(accountId: bigint): Promise<DiscordAccountConfigType> {
    await this.ensureAccountExists(accountId);
    await Promise.all([
      this.discordRepository.deleteChannelMappingsByAccount(accountId),
      this.discordRepository.deleteRoleMappingsByAccount(accountId),
      this.discordRepository.deleteLinkedAccounts(accountId),
      this.discordRepository.deleteFeatureSyncsByAccount(accountId),
      this.discordRepository.deleteTeamForumsByAccount(accountId),
    ]);
    this.invalidateChannelIngestionTargetsCache();
    await this.discordRepository.deleteAccountConfig(accountId);
    const config = await this.getOrCreateAccountConfigRecord(accountId);
    return DiscordIntegrationResponseFormatter.formatAccountConfig(config);
  }

  async listRoleMappings(accountId: bigint): Promise<DiscordRoleMappingListType> {
    await this.ensureAccountExists(accountId);
    const mappings = await this.discordRepository.listRoleMappings(accountId);
    return DiscordIntegrationResponseFormatter.formatRoleMappingList(mappings);
  }

  async listAvailableChannels(accountId: bigint): Promise<DiscordGuildChannelType[]> {
    await this.ensureAccountExists(accountId);
    const config = await this.getOrCreateAccountConfigRecord(accountId);
    const guildId = config.guildid;
    if (!guildId) {
      return [];
    }

    const channels = await this.fetchGuildChannels(guildId);
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

  async listTeamForums(
    accountId: bigint,
    query?: DiscordTeamForumQueryType,
  ): Promise<DiscordTeamForumListType> {
    await this.ensureAccountExists(accountId);
    const seasonFilter = this.parseOptionalBigInt(query?.seasonId);
    const teamSeasonFilter = this.parseOptionalBigInt(query?.teamSeasonId);

    const records = await this.discordRepository.listTeamForums(accountId);
    const filtered = records.filter((record) => {
      if (teamSeasonFilter && record.teamseasonid !== teamSeasonFilter) {
        return false;
      }
      if (seasonFilter && record.seasonid !== seasonFilter) {
        return false;
      }
      return true;
    });

    return DiscordIntegrationResponseFormatter.formatTeamForumList(filtered);
  }

  async repairTeamForums(accountId: bigint): Promise<DiscordTeamForumRepairResultType> {
    await this.ensureAccountExists(accountId);
    return this.syncTeamForums(accountId);
  }

  async listCommunityChannels(
    accountId: bigint,
    seasonId: bigint,
    query?: CommunityChannelQueryType,
  ): Promise<CommunityChannelType[]> {
    await this.ensureAccountExists(accountId);
    const config = await this.getOrCreateAccountConfigRecord(accountId);
    if (!config.guildid) {
      return [];
    }

    const mappings = await this.discordRepository.listChannelMappings(accountId);
    const teamSeasonFilter = this.parseOptionalBigInt(query?.teamSeasonId);

    const filtered = mappings.filter((mapping) => {
      switch (mapping.scope) {
        case 'account':
          return !teamSeasonFilter;
        case 'season':
          return !teamSeasonFilter && mapping.seasonid === seasonId;
        case 'teamSeason':
          return Boolean(teamSeasonFilter && mapping.teamseasonid === teamSeasonFilter);
        default:
          return false;
      }
    });

    const guildBaseUrl = `https://discord.com/channels/${config.guildid}`;

    return filtered.map((mapping) => ({
      id: mapping.id.toString(),
      accountId: mapping.accountid.toString(),
      seasonId: (mapping.seasonid ?? seasonId).toString(),
      discordChannelId: mapping.channelid,
      name: mapping.channelname,
      label: mapping.label ?? null,
      scope: mapping.scope as CommunityChannelType['scope'],
      channelType: mapping.channeltype ?? null,
      url: `${guildBaseUrl}/${mapping.channelid}`,
      teamId: mapping.teamid ? mapping.teamid.toString() : undefined,
      teamSeasonId: mapping.teamseasonid ? mapping.teamseasonid.toString() : undefined,
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

    this.invalidateChannelIngestionTargetsCache();
    return DiscordIntegrationResponseFormatter.formatChannelMapping(created);
  }

  async deleteChannelMapping(accountId: bigint, mappingId: bigint): Promise<void> {
    await this.ensureAccountExists(accountId);
    const mapping = await this.discordRepository.findChannelMappingById(accountId, mappingId);
    if (!mapping) {
      throw new NotFoundError('Channel mapping not found');
    }
    await this.discordRepository.deleteChannelMapping(accountId, mappingId);
    this.invalidateChannelIngestionTargetsCache();
  }

  async getChannelIngestionTargets(): Promise<DiscordIngestionTarget[]> {
    if (this.channelIngestionTargetsCache) {
      return this.channelIngestionTargetsCache.map((target) => ({ ...target }));
    }

    const mappings = await this.discordRepository.listAllChannelMappings();
    const targets: DiscordIngestionTarget[] = [];
    const accountSeasonCache = new Map<bigint, bigint>();
    const accountConfigCache = new Map<bigint, accountdiscordsettings>();

    const getAccountConfig = async (accountId: bigint): Promise<accountdiscordsettings> => {
      const cached = accountConfigCache.get(accountId);
      if (cached) {
        return cached;
      }
      const config = await this.getOrCreateAccountConfigRecord(accountId);
      accountConfigCache.set(accountId, config);
      return config;
    };

    for (const mapping of mappings) {
      const config = await getAccountConfig(mapping.accountid);
      const guildId = config.guildid ?? undefined;

      if (mapping.scope === 'teamSeason' && !config.teamforumenabled) {
        continue;
      }

      if (mapping.scope === 'account') {
        let seasonId = accountSeasonCache.get(mapping.accountid);
        if (!seasonId) {
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

          seasonId = currentSeason.id;
          accountSeasonCache.set(mapping.accountid, seasonId);
        }

        targets.push({
          accountId: mapping.accountid,
          seasonId,
          teamSeasonId: undefined,
          teamId: undefined,
          channelId: mapping.channelid,
          label: mapping.label ?? undefined,
          guildId,
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
        guildId,
      });
    }

    this.channelIngestionTargetsCache = targets;
    return targets.map((target) => ({ ...target }));
  }

  private invalidateChannelIngestionTargetsCache(): void {
    this.channelIngestionTargetsCache = null;
  }

  clearChannelIngestionTargetsCacheForAccount(_accountId: bigint): void {
    this.invalidateChannelIngestionTargetsCache();
  }

  async getFeatureSyncStatus(
    accountId: bigint,
    feature: DiscordFeatureSyncFeatureType,
  ): Promise<DiscordFeatureSyncStatusType> {
    await this.ensureAccountExists(accountId);
    this.ensureFeatureSupported(feature);
    const config = await this.getOrCreateAccountConfigRecord(accountId);
    const record = await this.discordRepository.getFeatureSync(accountId, feature);
    return DiscordIntegrationResponseFormatter.formatFeatureSync(
      feature,
      record,
      Boolean(config.guildid),
    );
  }

  async updateFeatureSync(
    accountId: bigint,
    feature: DiscordFeatureSyncFeatureType,
    payload: DiscordFeatureSyncUpdateType,
  ): Promise<DiscordFeatureSyncStatusType> {
    await this.ensureAccountExists(accountId);
    this.ensureFeatureSupported(feature);
    const config = await this.getOrCreateAccountConfigRecord(accountId);

    if (!payload.enabled) {
      const updated = await this.discordRepository.upsertFeatureSync(accountId, {
        feature,
        enabled: false,
        discordChannelId: null,
        discordChannelName: null,
        channelType: null,
        autoCreated: false,
        lastSyncedAt: null,
      });

      return DiscordIntegrationResponseFormatter.formatFeatureSync(
        feature,
        updated,
        Boolean(config.guildid),
      );
    }

    this.ensureGuildConfigured(config);

    if (!payload.channel) {
      throw new ValidationError('Channel configuration is required when enabling sync.');
    }

    const { channelId, channelName, channelType, autoCreated } = await this.resolveFeatureChannel(
      config,
      payload.channel,
    );

    const updated = await this.discordRepository.upsertFeatureSync(accountId, {
      feature,
      enabled: true,
      discordChannelId: channelId,
      discordChannelName: channelName,
      channelType,
      autoCreated,
      lastSyncedAt: null,
    });

    return DiscordIntegrationResponseFormatter.formatFeatureSync(
      feature,
      updated,
      Boolean(config.guildid),
    );
  }

  private async syncTeamForums(accountId: bigint): Promise<DiscordTeamForumRepairResultType> {
    const config = await this.getOrCreateAccountConfigRecord(accountId);
    if (!config.teamforumenabled) {
      return {
        created: 0,
        repaired: 0,
        skipped: 0,
        message: 'Team forums are currently disabled.',
      };
    }

    this.ensureGuildConfigured(config);

    const currentSeason = await this.seasonsRepository.findCurrentSeason(accountId);
    if (!currentSeason) {
      throw new ValidationError('Set a current season before enabling Discord team forums.');
    }

    const teamSeasons = await this.teamRepository.findBySeasonId(currentSeason.id, accountId);
    const assignedTeams = teamSeasons.filter(
      (teamSeason) => Boolean(teamSeason.divisionseasonid) && Boolean(teamSeason.leagueseason),
    );

    if (!assignedTeams.length) {
      return {
        created: 0,
        repaired: 0,
        skipped: 0,
        message: 'No assigned teams found for the current season.',
      };
    }

    const [existingForums, channelMappings] = await Promise.all([
      this.discordRepository.listTeamForums(accountId),
      this.discordRepository.listChannelMappings(accountId),
    ]);

    const mappingByTeamSeason = new Map(
      channelMappings
        .filter((mapping) => mapping.teamseasonid)
        .map((mapping) => [mapping.teamseasonid!.toString(), mapping]),
    );
    const forumsByTeamSeason = new Map(
      existingForums.map((forum) => [forum.teamseasonid.toString(), forum]),
    );

    const guildChannels = await this.fetchGuildChannels(config.guildid as string);
    const guildChannelById = new Map(guildChannels.map((channel) => [channel.id, channel]));
    const leagueCategoryCache = new Map<string, string | null>();

    let created = 0;
    let repaired = 0;
    let skipped = 0;

    for (const teamSeason of assignedTeams) {
      const key = teamSeason.id.toString();
      const existingForum = forumsByTeamSeason.get(key);
      try {
        const categoryId = await this.resolveLeagueCategoryId({
          guildId: config.guildid as string,
          seasonName: currentSeason.name,
          leagueName: teamSeason.leagueseason?.league?.name ?? null,
          leagueKey: `${currentSeason.id}-${teamSeason.leagueseason?.league?.id?.toString() ?? 'general'}`,
          existingChannels: guildChannels,
          categoryCache: leagueCategoryCache,
        });

        if (!existingForum) {
          const createdForum = await this.createTeamForumChannelRecord({
            accountId,
            config,
            seasonId: currentSeason.id,
            seasonName: currentSeason.name,
            teamSeason,
            categoryId,
            mappingByTeamSeason,
          });
          forumsByTeamSeason.set(key, createdForum);
          created += 1;
        } else {
          const channelExists = guildChannelById.has(existingForum.discordchannelid);
          if (!channelExists || existingForum.status !== 'provisioned') {
            const updatedForum = await this.rebuildTeamForumChannel({
              accountId,
              config,
              seasonId: currentSeason.id,
              seasonName: currentSeason.name,
              teamSeason,
              forum: existingForum,
              categoryId,
              mappingByTeamSeason,
            });
            forumsByTeamSeason.set(key, updatedForum);
            repaired += 1;
          } else {
            const label = this.buildTeamForumLabel(teamSeason.name, currentSeason.name);
            await this.ensureTeamChannelMapping(
              accountId,
              existingForum,
              label,
              mappingByTeamSeason,
            );
            skipped += 1;
          }
        }
      } catch (error) {
        console.error('[discord] Failed to synchronize team forum', {
          accountId: accountId.toString(),
          teamSeasonId: teamSeason.id.toString(),
          error,
        });
        if (existingForum) {
          await this.discordRepository
            .updateTeamForum(existingForum.id, {
              status: 'needsRepair',
              lastSyncedAt: new Date(),
            })
            .catch(() => undefined);
        }
      }
    }

    await this.discordRepository.updateAccountConfig(accountId, {
      teamForumLastSyncedAt: new Date(),
    });

    return {
      created,
      repaired,
      skipped,
      message: 'Team forums synchronized.',
    };
  }

  private async createTeamForumChannelRecord({
    accountId,
    config,
    seasonId,
    seasonName,
    teamSeason,
    categoryId,
    mappingByTeamSeason,
  }: {
    accountId: bigint;
    config: accountdiscordsettings;
    seasonId: bigint;
    seasonName?: string | null;
    teamSeason: dbTeamSeasonWithLeaguesAndTeams;
    categoryId: string | null;
    mappingByTeamSeason: Map<string, accountdiscordchannels>;
  }): Promise<accountdiscordteamforums> {
    if (!teamSeason.teamid) {
      throw new ValidationError('Team season is missing a team identifier.');
    }
    const channelName = this.buildTeamForumChannelName(
      teamSeason.name ?? null,
      teamSeason.leagueseason?.league?.name ?? null,
    );
    const createdChannel = await this.createDiscordChannel(
      config.guildid as string,
      channelName,
      'text',
      categoryId ? { parentId: categoryId } : undefined,
    );
    const record = await this.discordRepository.createTeamForum(accountId, {
      seasonId,
      teamSeasonId: teamSeason.id,
      teamId: teamSeason.teamid,
      discordChannelId: createdChannel.id,
      discordChannelName: createdChannel.name,
      channelType: createdChannel.type ?? 'forum',
      status: 'provisioned',
      autoCreated: true,
      lastSyncedAt: new Date(),
    });
    const label = this.buildTeamForumLabel(
      teamSeason.name ?? null,
      seasonName ?? null,
      teamSeason.leagueseason?.league?.name ?? null,
    );
    await this.ensureTeamChannelMapping(accountId, record, label, mappingByTeamSeason);
    return record;
  }

  private async rebuildTeamForumChannel({
    accountId,
    config,
    seasonName,
    teamSeason,
    forum,
    categoryId,
    mappingByTeamSeason,
  }: {
    accountId: bigint;
    config: accountdiscordsettings;
    seasonId: bigint;
    seasonName?: string | null;
    teamSeason: dbTeamSeasonWithLeaguesAndTeams;
    forum: accountdiscordteamforums;
    categoryId: string | null;
    mappingByTeamSeason: Map<string, accountdiscordchannels>;
  }): Promise<accountdiscordteamforums> {
    if (!teamSeason.teamid) {
      throw new ValidationError('Team season is missing a team identifier.');
    }
    await this.deleteDiscordChannel(config.guildid as string, forum.discordchannelid);
    const channelName = this.buildTeamForumChannelName(
      teamSeason.name ?? null,
      teamSeason.leagueseason?.league?.name ?? null,
    );
    const createdChannel = await this.createDiscordChannel(
      config.guildid as string,
      channelName,
      'text',
      categoryId ? { parentId: categoryId } : undefined,
    );
    const updated = await this.discordRepository.updateTeamForum(forum.id, {
      discordChannelId: createdChannel.id,
      discordChannelName: createdChannel.name,
      channelType: createdChannel.type ?? 'forum',
      status: 'provisioned',
      autoCreated: true,
      lastSyncedAt: new Date(),
    });
    const label = this.buildTeamForumLabel(
      teamSeason.name ?? teamSeason.leagueseason?.league?.name ?? null,
      seasonName ?? null,
      teamSeason.leagueseason?.league?.name ?? null,
    );
    await this.ensureTeamChannelMapping(accountId, updated, label, mappingByTeamSeason);
    return updated;
  }

  private async ensureTeamChannelMapping(
    accountId: bigint,
    forum: accountdiscordteamforums,
    label: string,
    mappingByTeamSeason: Map<string, accountdiscordchannels>,
  ): Promise<void> {
    const key = forum.teamseasonid.toString();
    const existingMapping = mappingByTeamSeason.get(key);
    if (existingMapping) {
      if (existingMapping.channelid === forum.discordchannelid) {
        return;
      }
      await this.discordRepository.deleteChannelMapping(accountId, existingMapping.id);
      this.invalidateChannelIngestionTargetsCache();
      mappingByTeamSeason.delete(key);
    }
    const createdMapping = await this.discordRepository.createChannelMapping(accountId, {
      discordChannelId: forum.discordchannelid,
      discordChannelName: forum.discordchannelname,
      channelType: forum.channeltype ?? 'forum',
      label,
      scope: 'teamSeason',
      seasonId: forum.seasonid,
      teamSeasonId: forum.teamseasonid,
      teamId: forum.teamid,
    });
    mappingByTeamSeason.set(key, createdMapping);
    this.invalidateChannelIngestionTargetsCache();
  }

  private async disableTeamForums(accountId: bigint, mode: TeamForumCleanupMode): Promise<void> {
    const forums = await this.discordRepository.listTeamForums(accountId);
    if (!forums.length) {
      await this.discordRepository.updateAccountConfig(accountId, {
        teamForumLastSyncedAt: null,
      });
      return;
    }

    if (mode === 'remove') {
      const config = await this.getOrCreateAccountConfigRecord(accountId);
      const channelMappings = await this.discordRepository.listChannelMappings(accountId);
      const mappingByTeamSeason = new Map(
        channelMappings
          .filter((mapping) => mapping.teamseasonid)
          .map((mapping) => [mapping.teamseasonid!.toString(), mapping]),
      );
      let channelMappingsChanged = false;

      for (const forum of forums) {
        if (config.guildid) {
          await this.deleteDiscordChannel(config.guildid, forum.discordchannelid);
        }
        await this.discordRepository.deleteTeamForum(forum.id);
        const mapping = mappingByTeamSeason.get(forum.teamseasonid.toString());
        if (mapping) {
          await this.discordRepository.deleteChannelMapping(accountId, mapping.id);
          channelMappingsChanged = true;
        }
      }

      if (channelMappingsChanged) {
        this.invalidateChannelIngestionTargetsCache();
      }
    } else {
      for (const forum of forums) {
        await this.discordRepository.updateTeamForum(forum.id, {
          status: 'disabled',
          lastSyncedAt: new Date(),
        });
      }
    }

    await this.discordRepository.updateAccountConfig(accountId, {
      teamForumLastSyncedAt: null,
    });
  }

  private buildTeamForumChannelName(teamName?: string | null, leagueName?: string | null): string {
    const trimmedTeam = teamName?.trim();
    const trimmedLeague = leagueName?.trim();
    const raw = trimmedTeam || trimmedLeague || 'team-forum';
    return this.sanitizeChannelName(raw);
  }

  private buildSeasonLeagueCategoryName(
    seasonName?: string | null,
    leagueName?: string | null,
  ): string {
    const seasonLabel = seasonName?.trim() || 'Season';
    const leagueLabel = leagueName?.trim() || 'General';
    const combined = `${seasonLabel} - ${leagueLabel}`;
    return combined.slice(0, 100);
  }

  private buildTeamForumLabel(
    teamName?: string | null,
    seasonName?: string | null,
    leagueName?: string | null,
  ): string {
    const trimmedTeam = teamName?.trim();
    const trimmedSeason = seasonName?.trim();
    const trimmedLeague = leagueName?.trim();
    const base = trimmedLeague
      ? `${trimmedLeague} - ${trimmedTeam || 'Team Forum'}`
      : trimmedTeam || 'Team Forum';
    if (trimmedSeason) {
      return `${base} (${trimmedSeason})`;
    }
    return base;
  }

  private async resolveLeagueCategoryId({
    guildId,
    seasonName,
    leagueName,
    leagueKey,
    existingChannels,
    categoryCache,
  }: {
    guildId: string;
    seasonName?: string | null;
    leagueName?: string | null;
    leagueKey: string;
    existingChannels?: DiscordGuildChannelResponse[];
    categoryCache: Map<string, string | null>;
  }): Promise<string | null> {
    if (categoryCache.has(leagueKey)) {
      return categoryCache.get(leagueKey) ?? null;
    }
    const categoryId = await this.ensureSeasonLeagueCategory(
      guildId,
      seasonName,
      leagueName,
      existingChannels,
    );
    categoryCache.set(leagueKey, categoryId ?? null);
    return categoryId;
  }

  private async ensureSeasonLeagueCategory(
    guildId: string,
    seasonName?: string | null,
    leagueName?: string | null,
    existingChannels?: DiscordGuildChannelResponse[],
  ): Promise<string | null> {
    const desiredName = this.buildSeasonLeagueCategoryName(seasonName, leagueName);
    const existing = existingChannels?.find(
      (channel) => channel.type === 4 && channel.name === desiredName,
    );
    if (existing) {
      return existing.id;
    }
    const created = await this.createDiscordChannel(guildId, desiredName, 'category');
    existingChannels?.push({ id: created.id, name: desiredName, type: 4 });
    return created.id;
  }

  private async deleteDiscordChannel(guildId: string, channelId: string): Promise<void> {
    const botToken = this.getBotToken();
    try {
      const response = await fetch(`${getDiscordOAuthConfig().apiBaseUrl}/channels/${channelId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      });
      if (!response.ok && response.status !== 404) {
        const body = await response.text().catch(() => response.statusText);
        console.warn('Unable to delete Discord channel', {
          guildId,
          channelId,
          status: response.status,
          body,
        });
      }
    } catch (error) {
      console.error('Unable to delete Discord channel', { guildId, channelId, error });
    }
  }

  private parseOptionalBigInt(value?: string | null): bigint | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    try {
      return BigInt(value);
    } catch {
      throw new ValidationError('Invalid identifier provided.');
    }
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
        this.sanitizeChannelName(payload.newChannelName),
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

  private async resolveFeatureChannel(
    config: accountdiscordsettings,
    channel: DiscordFeatureSyncChannelType,
  ): Promise<{
    channelId: string;
    channelName: string;
    channelType?: string | null;
    autoCreated: boolean;
  }> {
    if (channel.mode === 'autoCreate') {
      const createdChannel = await this.createDiscordChannel(
        config.guildid as string,
        this.sanitizeChannelName(channel.newChannelName),
        channel.newChannelType,
      );
      return {
        channelId: createdChannel.id,
        channelName: createdChannel.name,
        channelType: createdChannel.type ?? null,
        autoCreated: true,
      };
    }

    return {
      channelId: channel.discordChannelId,
      channelName: channel.discordChannelName,
      channelType: channel.channelType ?? null,
      autoCreated: false,
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

    const expiresAt = new Date(statePayload.expiresAt);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
      throw new ValidationError('Discord install state has expired. Please restart the flow.');
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
    options?: { parentId?: string },
  ): Promise<CreatedDiscordChannel> {
    const botToken = this.getBotToken();
    let typeValue: number;
    switch (channelType) {
      case 'announcement':
        typeValue = 5;
        break;
      case 'forum':
        typeValue = 15;
        break;
      case 'category':
        typeValue = 4;
        break;
      default:
        typeValue = 0;
        break;
    }
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
            parent_id: options?.parentId ?? undefined,
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
      throw new ValidationError(this.formatDiscordChannelError(error));
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

  private sanitizeChannelName(name: string): string {
    const trimmed = name.trim().toLowerCase();
    const slug = trimmed.replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
    const normalized = slug || 'draco-channel';
    return normalized.slice(0, 100);
  }

  private ensureFeatureSupported(
    feature: string,
  ): asserts feature is DiscordFeatureSyncFeatureType {
    if (!SUPPORTED_FEATURES.includes(feature as DiscordFeatureSyncFeatureType)) {
      throw new ValidationError(`Unsupported Discord feature sync: ${feature}`);
    }
  }

  async publishAnnouncement(accountId: bigint, announcement: AnnouncementType): Promise<void> {
    try {
      await this.ensureAccountExists(accountId);
      const featureRecord = await this.discordRepository.getFeatureSync(accountId, 'announcements');
      if (!featureRecord || !featureRecord.enabled || !featureRecord.discordchannelid) {
        return;
      }

      const content = this.composeAnnouncementMessage(announcement);
      if (!content) {
        return;
      }

      await this.postDiscordMessage(featureRecord.discordchannelid, content);
      await this.discordRepository.upsertFeatureSync(accountId, {
        feature: 'announcements',
        enabled: true,
        discordChannelId: featureRecord.discordchannelid,
        discordChannelName: featureRecord.discordchannelname ?? null,
        channelType: featureRecord.channeltype ?? null,
        autoCreated: featureRecord.autocreated ?? false,
        lastSyncedAt: new Date(),
      });
    } catch (error) {
      console.error('[discord] Failed to publish announcement', {
        accountId: accountId.toString(),
        announcementId: announcement.id,
        error,
      });
    }
  }

  private composeAnnouncementMessage(announcement: AnnouncementType): string | null {
    const title = announcement.title?.trim();
    const body = announcement.body ? this.stripHtml(announcement.body).trim() : '';

    const segments = [title ? `**${title}**` : null, body || null].filter(
      (segment): segment is string => Boolean(segment),
    );

    if (!segments.length) {
      return null;
    }

    const message = segments.join('\n\n').slice(0, 1900);
    return message || null;
  }

  private async postDiscordMessage(channelId: string, content: string): Promise<void> {
    const botToken = this.getBotToken();
    try {
      await fetchJson(`${getDiscordOAuthConfig().apiBaseUrl}/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          allowed_mentions: { parse: [] },
        }),
        timeoutMs: 10000,
      });
    } catch (error) {
      console.error('Unable to post Discord message', error);
      throw error;
    }
  }

  private stripHtml(value: string): string {
    return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  }

  private formatDiscordChannelError(error: unknown): string {
    if (error instanceof Error) {
      const message = error.message || '';
      if (message.includes('50013') || /Missing Permissions/gi.test(message)) {
        return 'Draco needs the "Manage Channels" permission in your Discord guild to auto-create channels. Update the bot permissions and try again.';
      }
      if (message.includes('401') || /Unauthorized/gi.test(message)) {
        return 'Discord rejected the request. Verify the DISCORD_BOT_TOKEN and reinstall the bot.';
      }
      if (message.includes('404')) {
        return 'Discord could not find the guild when creating the channel. Confirm the guild ID is correct.';
      }
    }
    return 'Unable to create the Discord channel. Please try again.';
  }
}
