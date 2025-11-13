import {
  accountdiscordsettings,
  accountdiscordrolemapping,
  accountdiscordchannels,
  userdiscordaccounts,
  PrismaClient,
} from '@prisma/client';
import {
  DiscordAccountConfigUpsertInput,
  DiscordLinkUpsertInput,
  DiscordRoleMappingUpsertInput,
  DiscordChannelMappingCreateInput,
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
    return this.prisma.accountdiscordsettings.upsert({
      where: { accountid: accountId },
      create: {
        accountid: accountId,
        guildid: data.guildId ?? null,
        guildname: data.guildName ?? null,
        rolesyncenabled: data.roleSyncEnabled ?? false,
      },
      update: {
        guildid: data.guildId ?? null,
        guildname: data.guildName ?? null,
        rolesyncenabled: data.roleSyncEnabled ?? false,
      },
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
}
