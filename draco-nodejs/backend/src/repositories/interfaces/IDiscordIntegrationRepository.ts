import {
  accountdiscordsettings,
  accountdiscordrolemapping,
  accountdiscordchannels,
  accountdiscordfeaturesync,
  accountdiscordteamforums,
  userdiscordaccounts,
} from '@prisma/client';

export interface DiscordAccountConfigUpsertInput {
  guildId?: string | null;
  guildName?: string | null;
  roleSyncEnabled?: boolean;
  teamForumEnabled?: boolean;
  teamForumLastSyncedAt?: Date | null;
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

export interface DiscordChannelMappingCreateInput {
  discordChannelId: string;
  discordChannelName: string;
  channelType?: string | null;
  label?: string | null;
  scope: 'account' | 'season' | 'teamSeason';
  seasonId?: bigint | null;
  teamSeasonId?: bigint | null;
  teamId?: bigint | null;
}

export interface DiscordFeatureSyncUpsertInput {
  feature: string;
  enabled: boolean;
  discordChannelId?: string | null;
  discordChannelName?: string | null;
  channelType?: string | null;
  autoCreated?: boolean;
  lastSyncedAt?: Date | null;
}

export interface DiscordTeamForumCreateInput {
  seasonId: bigint;
  teamSeasonId: bigint;
  teamId: bigint;
  discordChannelId: string;
  discordChannelName: string;
  channelType?: string | null;
  discordRoleId?: string | null;
  status: string;
  autoCreated?: boolean;
  lastSyncedAt?: Date | null;
}

export interface DiscordTeamForumUpdateInput {
  discordChannelId?: string;
  discordChannelName?: string;
  channelType?: string | null;
  discordRoleId?: string | null;
  status?: string;
  autoCreated?: boolean;
  lastSyncedAt?: Date | null;
}

export interface IDiscordIntegrationRepository {
  getAccountConfig(accountId: bigint): Promise<accountdiscordsettings | null>;
  createAccountConfig(accountId: bigint): Promise<accountdiscordsettings>;
  updateAccountConfig(
    accountId: bigint,
    data: DiscordAccountConfigUpsertInput,
  ): Promise<accountdiscordsettings>;
  deleteAccountConfig(accountId: bigint): Promise<void>;

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
  deleteRoleMappingsByAccount(accountId: bigint): Promise<void>;

  listLinkedAccounts(accountId: bigint): Promise<userdiscordaccounts[]>;
  findLinkedAccount(accountId: bigint, userId: string): Promise<userdiscordaccounts | null>;
  upsertLinkedAccount(data: DiscordLinkUpsertInput): Promise<userdiscordaccounts>;
  deleteLinkedAccount(accountId: bigint, userId: string): Promise<void>;
  deleteLinkedAccounts(accountId: bigint): Promise<void>;

  listChannelMappings(accountId: bigint): Promise<accountdiscordchannels[]>;
  findChannelMappingById(
    accountId: bigint,
    mappingId: bigint,
  ): Promise<accountdiscordchannels | null>;
  createChannelMapping(
    accountId: bigint,
    data: DiscordChannelMappingCreateInput,
  ): Promise<accountdiscordchannels>;
  deleteChannelMapping(accountId: bigint, mappingId: bigint): Promise<void>;
  listAllChannelMappings(): Promise<accountdiscordchannels[]>;
  deleteChannelMappingsByAccount(accountId: bigint): Promise<void>;

  getFeatureSync(accountId: bigint, feature: string): Promise<accountdiscordfeaturesync | null>;
  upsertFeatureSync(
    accountId: bigint,
    data: DiscordFeatureSyncUpsertInput,
  ): Promise<accountdiscordfeaturesync>;
  deleteFeatureSync(accountId: bigint, feature: string): Promise<void>;
  deleteFeatureSyncsByAccount(accountId: bigint): Promise<void>;

  listTeamForums(accountId: bigint): Promise<accountdiscordteamforums[]>;
  findTeamForumByTeamSeasonId(
    accountId: bigint,
    teamSeasonId: bigint,
  ): Promise<accountdiscordteamforums | null>;
  createTeamForum(
    accountId: bigint,
    data: DiscordTeamForumCreateInput,
  ): Promise<accountdiscordteamforums>;
  updateTeamForum(
    forumId: bigint,
    data: DiscordTeamForumUpdateInput,
  ): Promise<accountdiscordteamforums>;
  deleteTeamForum(forumId: bigint): Promise<void>;
  deleteTeamForumsByAccount(accountId: bigint): Promise<void>;
}
