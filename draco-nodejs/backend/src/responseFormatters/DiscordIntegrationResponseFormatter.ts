import type {
  accountdiscordsettings,
  accountdiscordrolemapping,
  accountdiscordchannels,
  accountdiscordfeaturesync,
  userdiscordaccounts,
  accountdiscordteamforums,
} from '#prisma/client';
import {
  DiscordAccountConfigType,
  DiscordLinkStatusType,
  DiscordRoleMappingListType,
  DiscordRoleMappingType,
  DiscordChannelMappingType,
  DiscordChannelMappingListType,
  DiscordGuildChannelType,
  DiscordFeatureSyncStatusType,
  DiscordFeatureSyncFeatureType,
  DiscordTeamForumType,
  DiscordTeamForumListType,
} from '@draco/shared-schemas';

export class DiscordIntegrationResponseFormatter {
  static formatAccountConfig(record: accountdiscordsettings): DiscordAccountConfigType {
    return {
      id: record.id.toString(),
      accountId: record.accountid.toString(),
      guildId: record.guildid ?? null,
      guildName: record.guildname ?? null,
      roleSyncEnabled: Boolean(record.rolesyncenabled),
      teamForumEnabled: Boolean(record.teamforumenabled),
      createdAt: record.createdat.toISOString(),
      updatedAt: record.updatedat.toISOString(),
    };
  }

  static formatRoleMapping(record: accountdiscordrolemapping): DiscordRoleMappingType {
    return {
      id: record.id.toString(),
      accountId: record.accountid.toString(),
      discordRoleId: record.discordroleid,
      discordRoleName: record.discordrolename,
      permissions: record.permissions ?? [],
      createdAt: record.createdat.toISOString(),
      updatedAt: record.updatedat.toISOString(),
    };
  }

  static formatRoleMappingList(records: accountdiscordrolemapping[]): DiscordRoleMappingListType {
    return {
      roleMappings: records.map((record) => this.formatRoleMapping(record)),
    };
  }

  static formatLinkStatus(
    record: userdiscordaccounts | null,
    linkingEnabled: boolean,
  ): DiscordLinkStatusType {
    if (!record) {
      return {
        linkingEnabled,
        linked: false,
        username: null,
        discriminator: null,
        avatarUrl: null,
        guildMember: false,
        lastSyncedAt: null,
      };
    }

    return {
      linkingEnabled,
      linked: true,
      username: record.username ?? null,
      discriminator: record.discriminator ?? null,
      avatarUrl: record.avatarurl ?? null,
      guildMember: Boolean(record.guildmember),
      lastSyncedAt: record.lastsyncedat ? record.lastsyncedat.toISOString() : null,
    };
  }

  static formatChannelMapping(record: accountdiscordchannels): DiscordChannelMappingType {
    return {
      id: record.id.toString(),
      accountId: record.accountid.toString(),
      discordChannelId: record.channelid,
      discordChannelName: record.channelname,
      channelType: record.channeltype ?? null,
      label: record.label ?? null,
      scope: record.scope as DiscordChannelMappingType['scope'],
      seasonId: record.seasonid ? record.seasonid.toString() : null,
      teamSeasonId: record.teamseasonid ? record.teamseasonid.toString() : null,
      teamId: record.teamid ? record.teamid.toString() : null,
      createdAt: record.createdat.toISOString(),
      updatedAt: record.updatedat.toISOString(),
    };
  }

  static formatChannelMappingList(
    records: accountdiscordchannels[],
  ): DiscordChannelMappingListType {
    return {
      channels: records.map((record) => this.formatChannelMapping(record)),
    };
  }

  static formatAvailableChannels(channels: DiscordGuildChannelType[]): DiscordGuildChannelType[] {
    return channels;
  }

  static formatFeatureSync(
    feature: DiscordFeatureSyncFeatureType,
    record: accountdiscordfeaturesync | null,
    guildConfigured: boolean,
  ): DiscordFeatureSyncStatusType {
    return {
      feature,
      enabled: Boolean(record?.enabled && record?.discordchannelid),
      guildConfigured,
      channel: record?.discordchannelid
        ? {
            discordChannelId: record.discordchannelid,
            discordChannelName: record.discordchannelname ?? '',
            channelType: record.channeltype ?? null,
            autoCreated: record.autocreated ?? false,
            lastSyncedAt: record.lastsyncedat ? record.lastsyncedat.toISOString() : null,
          }
        : null,
    };
  }

  static formatTeamForum(record: accountdiscordteamforums): DiscordTeamForumType {
    return {
      id: record.id.toString(),
      accountId: record.accountid.toString(),
      seasonId: record.seasonid.toString(),
      teamSeasonId: record.teamseasonid.toString(),
      teamId: record.teamid.toString(),
      discordChannelId: record.discordchannelid,
      discordChannelName: record.discordchannelname,
      channelType: record.channeltype ?? null,
      discordRoleId: record.discordroleid ?? null,
      status: record.status as DiscordTeamForumType['status'],
      autoCreated: Boolean(record.autocreated),
      lastSyncedAt: record.lastsyncedat ? record.lastsyncedat.toISOString() : null,
      createdAt: record.createdat.toISOString(),
      updatedAt: record.updatedat.toISOString(),
    };
  }

  static formatTeamForumList(records: accountdiscordteamforums[]): DiscordTeamForumListType {
    return {
      forums: records.map((record) => this.formatTeamForum(record)),
    };
  }
}
