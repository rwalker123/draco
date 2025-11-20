import {
  accountdiscordsettings,
  accountdiscordrolemapping,
  accountdiscordchannels,
  accountdiscordfeaturesync,
  accountdiscordteamforums,
  userdiscordaccounts,
  PrismaClient,
  Prisma,
} from '#prisma/client';
import {
  DiscordAccountConfigUpsertInput,
  DiscordLinkUpsertInput,
  DiscordRoleMappingUpsertInput,
  DiscordChannelMappingCreateInput,
  DiscordFeatureSyncUpsertInput,
  DiscordTeamForumCreateInput,
  DiscordTeamForumUpdateInput,
  IDiscordIntegrationRepository,
} from '../interfaces/IDiscordIntegrationRepository.js';

export class PrismaDiscordIntegrationRepository implements IDiscordIntegrationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getAccountConfig(accountId: bigint): Promise<accountdiscordsettings | null> {
    return this.prisma.accountdiscordsettings.findUnique({
      where: { accountid: accountId },
    });
  }

  async createAccountConfig(accountId: bigint): Promise<accountdiscordsettings> {
    return this.prisma.accountdiscordsettings.create({
      data: {
        accountid: accountId,
      },
    });
  }

  async updateAccountConfig(
    accountId: bigint,
    data: DiscordAccountConfigUpsertInput,
  ): Promise<accountdiscordsettings> {
    const createData: Prisma.accountdiscordsettingsCreateInput = {
      guildid: data.guildId ?? null,
      guildname: data.guildName ?? null,
      rolesyncenabled: data.roleSyncEnabled ?? false,
      teamforumenabled: data.teamForumEnabled ?? false,
      teamforumlastsynced: data.teamForumLastSyncedAt ?? null,
      accounts: {
        connect: { id: accountId },
      },
    };

    const updateData: Prisma.accountdiscordsettingsUpdateInput = {};

    if (data.guildId !== undefined) {
      updateData.guildid = data.guildId ?? null;
    }

    if (data.guildName !== undefined) {
      updateData.guildname = data.guildName ?? null;
    }

    if (data.roleSyncEnabled !== undefined) {
      updateData.rolesyncenabled = data.roleSyncEnabled;
    }

    if (data.teamForumEnabled !== undefined) {
      updateData.teamforumenabled = data.teamForumEnabled;
    }

    if (data.teamForumLastSyncedAt !== undefined) {
      updateData.teamforumlastsynced = data.teamForumLastSyncedAt ?? null;
    }

    return this.prisma.accountdiscordsettings.upsert({
      where: { accountid: accountId },
      create: createData,
      update: updateData,
    });
  }

  async deleteAccountConfig(accountId: bigint): Promise<void> {
    await this.prisma.accountdiscordsettings.deleteMany({
      where: { accountid: accountId },
    });
  }

  async listRoleMappings(accountId: bigint): Promise<accountdiscordrolemapping[]> {
    return this.prisma.accountdiscordrolemapping.findMany({
      where: { accountid: accountId },
      orderBy: { createdat: 'asc' },
    });
  }

  async findRoleMappingById(
    accountId: bigint,
    roleMappingId: bigint,
  ): Promise<accountdiscordrolemapping | null> {
    return this.prisma.accountdiscordrolemapping.findFirst({
      where: {
        id: roleMappingId,
        accountid: accountId,
      },
    });
  }

  async findRoleMappingByRoleId(
    accountId: bigint,
    discordRoleId: string,
  ): Promise<accountdiscordrolemapping | null> {
    return this.prisma.accountdiscordrolemapping.findFirst({
      where: {
        accountid: accountId,
        discordroleid: discordRoleId,
      },
    });
  }

  async createRoleMapping(
    accountId: bigint,
    data: DiscordRoleMappingUpsertInput,
  ): Promise<accountdiscordrolemapping> {
    return this.prisma.accountdiscordrolemapping.create({
      data: {
        accountid: accountId,
        discordroleid: data.discordRoleId,
        discordrolename: data.discordRoleName,
        permissions: data.permissions,
      },
    });
  }

  async updateRoleMapping(
    roleMappingId: bigint,
    data: DiscordRoleMappingUpsertInput,
  ): Promise<accountdiscordrolemapping> {
    return this.prisma.accountdiscordrolemapping.update({
      where: { id: roleMappingId },
      data: {
        discordroleid: data.discordRoleId,
        discordrolename: data.discordRoleName,
        permissions: data.permissions,
      },
    });
  }

  async deleteRoleMapping(roleMappingId: bigint): Promise<void> {
    await this.prisma.accountdiscordrolemapping.delete({ where: { id: roleMappingId } });
  }

  async deleteRoleMappingsByAccount(accountId: bigint): Promise<void> {
    await this.prisma.accountdiscordrolemapping.deleteMany({
      where: { accountid: accountId },
    });
  }

  async listLinkedAccounts(accountId: bigint): Promise<userdiscordaccounts[]> {
    return this.prisma.userdiscordaccounts.findMany({
      where: { accountid: accountId },
      orderBy: { createdat: 'desc' },
    });
  }

  async findLinkedAccount(accountId: bigint, userId: string): Promise<userdiscordaccounts | null> {
    return this.prisma.userdiscordaccounts.findFirst({
      where: {
        accountid: accountId,
        userid: userId,
      },
    });
  }

  async upsertLinkedAccount(data: DiscordLinkUpsertInput): Promise<userdiscordaccounts> {
    return this.prisma.userdiscordaccounts.upsert({
      where: {
        accountid_userid: {
          accountid: data.accountId,
          userid: data.userId,
        },
      },
      create: {
        accountid: data.accountId,
        userid: data.userId,
        discorduserid: data.discordUserId,
        username: data.username ?? null,
        discriminator: data.discriminator ?? null,
        avatarurl: data.avatarUrl ?? null,
        accesstokenencrypted: data.accessTokenEncrypted ?? null,
        refreshtokenencrypted: data.refreshTokenEncrypted ?? null,
        tokenexpiresat: data.tokenExpiresAt ?? null,
        guildmember: Boolean(data.guildMember),
        lastsyncedat: data.lastSyncedAt ?? null,
      },
      update: {
        discorduserid: data.discordUserId,
        username: data.username ?? null,
        discriminator: data.discriminator ?? null,
        avatarurl: data.avatarUrl ?? null,
        accesstokenencrypted: data.accessTokenEncrypted ?? null,
        refreshtokenencrypted: data.refreshTokenEncrypted ?? null,
        tokenexpiresat: data.tokenExpiresAt ?? null,
        guildmember: Boolean(data.guildMember),
        lastsyncedat: data.lastSyncedAt ?? null,
      },
    });
  }

  async deleteLinkedAccount(accountId: bigint, userId: string): Promise<void> {
    await this.prisma.userdiscordaccounts.deleteMany({
      where: {
        accountid: accountId,
        userid: userId,
      },
    });
  }

  async deleteLinkedAccounts(accountId: bigint): Promise<void> {
    await this.prisma.userdiscordaccounts.deleteMany({
      where: { accountid: accountId },
    });
  }

  async listChannelMappings(accountId: bigint): Promise<accountdiscordchannels[]> {
    return this.prisma.accountdiscordchannels.findMany({
      where: { accountid: accountId },
      orderBy: { createdat: 'asc' },
    });
  }

  async listAllChannelMappings(): Promise<accountdiscordchannels[]> {
    return this.prisma.accountdiscordchannels.findMany();
  }

  async findChannelMappingById(
    accountId: bigint,
    mappingId: bigint,
  ): Promise<accountdiscordchannels | null> {
    return this.prisma.accountdiscordchannels.findFirst({
      where: {
        id: mappingId,
        accountid: accountId,
      },
    });
  }

  async createChannelMapping(
    accountId: bigint,
    data: DiscordChannelMappingCreateInput,
  ): Promise<accountdiscordchannels> {
    return this.prisma.accountdiscordchannels.create({
      data: {
        accountid: accountId,
        channelid: data.discordChannelId,
        channelname: data.discordChannelName,
        channeltype: data.channelType ?? null,
        label: data.label ?? null,
        scope: data.scope,
        seasonid: data.seasonId ?? null,
        teamseasonid: data.teamSeasonId ?? null,
        teamid: data.teamId ?? null,
      },
    });
  }

  async deleteChannelMapping(accountId: bigint, mappingId: bigint): Promise<void> {
    await this.prisma.accountdiscordchannels.deleteMany({
      where: {
        id: mappingId,
        accountid: accountId,
      },
    });
  }

  async deleteChannelMappingsByAccount(accountId: bigint): Promise<void> {
    await this.prisma.accountdiscordchannels.deleteMany({
      where: { accountid: accountId },
    });
  }

  async getFeatureSync(
    accountId: bigint,
    feature: string,
  ): Promise<accountdiscordfeaturesync | null> {
    return this.prisma.accountdiscordfeaturesync.findFirst({
      where: {
        accountid: accountId,
        feature,
      },
    });
  }

  async upsertFeatureSync(
    accountId: bigint,
    data: DiscordFeatureSyncUpsertInput,
  ): Promise<accountdiscordfeaturesync> {
    return this.prisma.accountdiscordfeaturesync.upsert({
      where: {
        accountid_feature: {
          accountid: accountId,
          feature: data.feature,
        },
      },
      create: {
        accountid: accountId,
        feature: data.feature,
        enabled: data.enabled,
        discordchannelid: data.discordChannelId ?? null,
        discordchannelname: data.discordChannelName ?? null,
        channeltype: data.channelType ?? null,
        autocreated: data.autoCreated ?? false,
        lastsyncedat: data.lastSyncedAt ?? null,
      },
      update: {
        enabled: data.enabled,
        discordchannelid: data.discordChannelId ?? null,
        discordchannelname: data.discordChannelName ?? null,
        channeltype: data.channelType ?? null,
        autocreated: data.autoCreated ?? false,
        lastsyncedat: data.lastSyncedAt ?? null,
      },
    });
  }

  async deleteFeatureSync(accountId: bigint, feature: string): Promise<void> {
    await this.prisma.accountdiscordfeaturesync.deleteMany({
      where: {
        accountid: accountId,
        feature,
      },
    });
  }

  async deleteFeatureSyncsByAccount(accountId: bigint): Promise<void> {
    await this.prisma.accountdiscordfeaturesync.deleteMany({
      where: {
        accountid: accountId,
      },
    });
  }

  async listTeamForums(accountId: bigint): Promise<accountdiscordteamforums[]> {
    return this.prisma.accountdiscordteamforums.findMany({
      where: { accountid: accountId },
      orderBy: { createdat: 'asc' },
    });
  }

  async findTeamForumByTeamSeasonId(
    accountId: bigint,
    teamSeasonId: bigint,
  ): Promise<accountdiscordteamforums | null> {
    return this.prisma.accountdiscordteamforums.findFirst({
      where: {
        accountid: accountId,
        teamseasonid: teamSeasonId,
      },
    });
  }

  async createTeamForum(
    accountId: bigint,
    data: DiscordTeamForumCreateInput,
  ): Promise<accountdiscordteamforums> {
    return this.prisma.accountdiscordteamforums.create({
      data: {
        accountid: accountId,
        seasonid: data.seasonId,
        teamseasonid: data.teamSeasonId,
        teamid: data.teamId,
        discordchannelid: data.discordChannelId,
        discordchannelname: data.discordChannelName,
        channeltype: data.channelType ?? null,
        discordroleid: data.discordRoleId ?? null,
        status: data.status,
        autocreated: data.autoCreated ?? false,
        lastsyncedat: data.lastSyncedAt ?? null,
      },
    });
  }

  async updateTeamForum(
    forumId: bigint,
    data: DiscordTeamForumUpdateInput,
  ): Promise<accountdiscordteamforums> {
    const updateData: Prisma.accountdiscordteamforumsUpdateInput = {};
    if (data.discordChannelId !== undefined) {
      updateData.discordchannelid = data.discordChannelId;
    }
    if (data.discordChannelName !== undefined) {
      updateData.discordchannelname = data.discordChannelName;
    }
    if (data.channelType !== undefined) {
      updateData.channeltype = data.channelType ?? null;
    }
    if (data.discordRoleId !== undefined) {
      updateData.discordroleid = data.discordRoleId ?? null;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.autoCreated !== undefined) {
      updateData.autocreated = data.autoCreated;
    }
    if (data.lastSyncedAt !== undefined) {
      updateData.lastsyncedat = data.lastSyncedAt ?? null;
    }

    return this.prisma.accountdiscordteamforums.update({
      where: { id: forumId },
      data: updateData,
    });
  }

  async deleteTeamForum(forumId: bigint): Promise<void> {
    await this.prisma.accountdiscordteamforums.deleteMany({
      where: { id: forumId },
    });
  }

  async deleteTeamForumsByAccount(accountId: bigint): Promise<void> {
    await this.prisma.accountdiscordteamforums.deleteMany({
      where: { accountid: accountId },
    });
  }
}
