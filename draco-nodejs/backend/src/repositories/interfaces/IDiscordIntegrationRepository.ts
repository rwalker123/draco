import {
  accountdiscordsettings,
  accountdiscordrolemapping,
  userdiscordaccounts,
} from '@prisma/client';

export interface DiscordAccountConfigUpsertInput {
  guildId?: string | null;
  guildName?: string | null;
  botUserId?: string | null;
  botUserName?: string | null;
  roleSyncEnabled?: boolean;
  botTokenEncrypted?: string | null;
}

export interface DiscordRoleMappingUpsertInput {
  discordRoleId: string;
  discordRoleName: string;
  permissions: string[];
}

export interface DiscordLinkUpsertInput {
  accountId: bigint;
  userId: string;
  discordUserId: string;
  username?: string | null;
  discriminator?: string | null;
  avatarUrl?: string | null;
  accessTokenEncrypted?: string | null;
  refreshTokenEncrypted?: string | null;
  tokenExpiresAt?: Date | null;
  guildMember?: boolean;
  lastSyncedAt?: Date | null;
}

export interface IDiscordIntegrationRepository {
  getAccountConfig(accountId: bigint): Promise<accountdiscordsettings | null>;
  createAccountConfig(accountId: bigint): Promise<accountdiscordsettings>;
  updateAccountConfig(
    accountId: bigint,
    data: DiscordAccountConfigUpsertInput,
  ): Promise<accountdiscordsettings>;

  listRoleMappings(accountId: bigint): Promise<accountdiscordrolemapping[]>;
  findRoleMappingById(
    accountId: bigint,
    roleMappingId: bigint,
  ): Promise<accountdiscordrolemapping | null>;
  findRoleMappingByRoleId(
    accountId: bigint,
    discordRoleId: string,
  ): Promise<accountdiscordrolemapping | null>;
  createRoleMapping(
    accountId: bigint,
    data: DiscordRoleMappingUpsertInput,
  ): Promise<accountdiscordrolemapping>;
  updateRoleMapping(
    roleMappingId: bigint,
    data: DiscordRoleMappingUpsertInput,
  ): Promise<accountdiscordrolemapping>;
  deleteRoleMapping(roleMappingId: bigint): Promise<void>;

  listLinkedAccounts(accountId: bigint): Promise<userdiscordaccounts[]>;
  findLinkedAccount(accountId: bigint, userId: string): Promise<userdiscordaccounts | null>;
  upsertLinkedAccount(data: DiscordLinkUpsertInput): Promise<userdiscordaccounts>;
  deleteLinkedAccount(accountId: bigint, userId: string): Promise<void>;
}
