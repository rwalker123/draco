import type {
  accountdiscordsettings,
  accountdiscordrolemapping,
  userdiscordaccounts,
} from '@prisma/client';
import {
  DiscordAccountConfigType,
  DiscordLinkStatusType,
  DiscordRoleMappingListType,
  DiscordRoleMappingType,
} from '@draco/shared-schemas';

export class DiscordIntegrationResponseFormatter {
  static formatAccountConfig(record: accountdiscordsettings): DiscordAccountConfigType {
    return {
      id: record.id.toString(),
      accountId: record.accountid.toString(),
      guildId: record.guildid ?? null,
      guildName: record.guildname ?? null,
      botUserId: record.botuserid ?? null,
      botUserName: record.botusername ?? null,
      roleSyncEnabled: Boolean(record.rolesyncenabled),
      botTokenConfigured: Boolean(record.bottokenencrypted),
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
}
