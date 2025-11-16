'use client';

import type {
  DiscordAccountConfigType,
  DiscordAccountConfigUpdateType,
  DiscordChannelMappingCreateType,
  DiscordChannelMappingListType,
  DiscordChannelMappingType,
  DiscordFeatureSyncFeatureType,
  DiscordFeatureSyncStatusType,
  DiscordFeatureSyncUpdateType,
  DiscordGuildChannelType,
  DiscordLinkStatusType,
  DiscordOAuthStartResponseType,
  DiscordRoleMappingListType,
  DiscordRoleMappingType,
  DiscordRoleMappingUpdateType,
  DiscordTeamForumListType,
  DiscordTeamForumQueryType,
  DiscordTeamForumRepairResultType,
} from '@draco/shared-schemas';
import type { Client } from '@draco/shared-api-client/generated/client';
import {
  createAccountDiscordChannelMapping,
  createAccountDiscordRoleMapping,
  deleteAccountDiscordChannelMapping,
  deleteAccountDiscordConfig,
  deleteAccountDiscordLink,
  deleteAccountDiscordRoleMapping,
  getAccountDiscordConfig,
  getAccountDiscordFeatureSync,
  getAccountDiscordLinkStatus,
  listAccountDiscordAvailableChannels,
  listAccountDiscordChannelMappings,
  listAccountDiscordRoleMappings,
  listAccountDiscordTeamForums,
  startAccountDiscordInstall,
  startAccountDiscordLink,
  repairAccountDiscordTeamForums,
  updateAccountDiscordConfig,
  updateAccountDiscordFeatureSync,
  updateAccountDiscordRoleMapping,
} from '@draco/shared-api-client';
import { unwrapApiResult, assertNoApiError } from '@/utils/apiResult';

export class DiscordIntegrationService {
  constructor(private readonly client: Client) {}

  async getAccountConfig(accountId: string): Promise<DiscordAccountConfigType> {
    const result = await getAccountDiscordConfig({
      client: this.client,
      path: { accountId },
      throwOnError: false,
    });
    return unwrapApiResult(result, 'Unable to load Discord configuration.');
  }

  async updateAccountConfig(
    accountId: string,
    payload: DiscordAccountConfigUpdateType,
  ): Promise<DiscordAccountConfigType> {
    const result = await updateAccountDiscordConfig({
      client: this.client,
      path: { accountId },
      body: payload,
      throwOnError: false,
    });
    return unwrapApiResult(result, 'Unable to update Discord configuration.');
  }

  async disconnectAccountGuild(accountId: string): Promise<DiscordAccountConfigType> {
    const result = await deleteAccountDiscordConfig({
      client: this.client,
      path: { accountId },
      throwOnError: false,
    });
    return unwrapApiResult(result, 'Unable to remove Discord configuration.');
  }

  async getLinkStatus(accountId: string): Promise<DiscordLinkStatusType> {
    const result = await getAccountDiscordLinkStatus({
      client: this.client,
      path: { accountId },
      throwOnError: false,
    });
    return unwrapApiResult(result, 'Unable to load Discord link status.');
  }

  async startLink(accountId: string): Promise<DiscordOAuthStartResponseType> {
    const result = await startAccountDiscordLink({
      client: this.client,
      path: { accountId },
      throwOnError: false,
    });
    return unwrapApiResult(result, 'Unable to start the Discord linking flow.');
  }

  async unlinkAccount(accountId: string): Promise<DiscordLinkStatusType> {
    const result = await deleteAccountDiscordLink({
      client: this.client,
      path: { accountId },
      throwOnError: false,
    });
    return unwrapApiResult(result, 'Unable to unlink the Discord account.');
  }

  async startBotInstall(accountId: string): Promise<DiscordOAuthStartResponseType> {
    const result = await startAccountDiscordInstall({
      client: this.client,
      path: { accountId },
      throwOnError: false,
    });
    return unwrapApiResult(result, 'Unable to start the Discord bot installation flow.');
  }

  async listRoleMappings(accountId: string): Promise<DiscordRoleMappingListType> {
    const result = await listAccountDiscordRoleMappings({
      client: this.client,
      path: { accountId },
      throwOnError: false,
    });
    return unwrapApiResult(result, 'Unable to load Discord role mappings.');
  }

  async createRoleMapping(
    accountId: string,
    payload: DiscordRoleMappingUpdateType,
  ): Promise<DiscordRoleMappingType> {
    const result = await createAccountDiscordRoleMapping({
      client: this.client,
      path: { accountId },
      body: payload,
      throwOnError: false,
    });
    return unwrapApiResult(result, 'Unable to create Discord role mapping.');
  }

  async updateRoleMapping(
    accountId: string,
    roleMappingId: string,
    payload: DiscordRoleMappingUpdateType,
  ): Promise<DiscordRoleMappingType> {
    const result = await updateAccountDiscordRoleMapping({
      client: this.client,
      path: { accountId, roleMappingId },
      body: payload,
      throwOnError: false,
    });
    return unwrapApiResult(result, 'Unable to update Discord role mapping.');
  }

  async deleteRoleMapping(accountId: string, roleMappingId: string): Promise<void> {
    const result = await deleteAccountDiscordRoleMapping({
      client: this.client,
      path: { accountId, roleMappingId },
      throwOnError: false,
    });
    assertNoApiError(result, 'Unable to delete Discord role mapping.');
  }

  async listChannelMappings(accountId: string): Promise<DiscordChannelMappingListType> {
    const result = await listAccountDiscordChannelMappings({
      client: this.client,
      path: { accountId },
      throwOnError: false,
    });
    return unwrapApiResult(result, 'Unable to load channel mappings.');
  }

  async listTeamForums(
    accountId: string,
    query?: Partial<DiscordTeamForumQueryType>,
  ): Promise<DiscordTeamForumListType> {
    const result = await listAccountDiscordTeamForums({
      client: this.client,
      path: { accountId },
      query: this.buildQuery(query),
      throwOnError: false,
    });
    return unwrapApiResult(result, 'Unable to load Discord team forums.');
  }

  async repairTeamForums(accountId: string): Promise<DiscordTeamForumRepairResultType> {
    const result = await repairAccountDiscordTeamForums({
      client: this.client,
      path: { accountId },
      throwOnError: false,
    });
    return unwrapApiResult(result, 'Unable to repair Discord team forums.');
  }

  async createChannelMapping(
    accountId: string,
    payload: DiscordChannelMappingCreateType,
  ): Promise<DiscordChannelMappingType> {
    const result = await createAccountDiscordChannelMapping({
      client: this.client,
      path: { accountId },
      body: payload,
      throwOnError: false,
    });
    return unwrapApiResult(result, 'Unable to add the channel mapping.');
  }

  async deleteChannelMapping(accountId: string, mappingId: string): Promise<void> {
    const result = await deleteAccountDiscordChannelMapping({
      client: this.client,
      path: { accountId, mappingId },
      throwOnError: false,
    });
    assertNoApiError(result, 'Unable to delete the channel mapping.');
  }

  async listAvailableChannels(accountId: string): Promise<DiscordGuildChannelType[]> {
    const result = await listAccountDiscordAvailableChannels({
      client: this.client,
      path: { accountId },
      throwOnError: false,
    });
    return unwrapApiResult(result, 'Unable to load Discord channels.');
  }

  async getFeatureSyncStatus(
    accountId: string,
    feature: DiscordFeatureSyncFeatureType,
  ): Promise<DiscordFeatureSyncStatusType> {
    const result = await getAccountDiscordFeatureSync({
      client: this.client,
      path: { accountId, feature },
      throwOnError: false,
    });
    return unwrapApiResult(result, 'Unable to load Discord sync status.');
  }

  async updateFeatureSync(
    accountId: string,
    feature: DiscordFeatureSyncFeatureType,
    payload: DiscordFeatureSyncUpdateType,
  ): Promise<DiscordFeatureSyncStatusType> {
    const result = await updateAccountDiscordFeatureSync({
      client: this.client,
      path: { accountId, feature },
      body: payload,
      throwOnError: false,
    });
    return unwrapApiResult(result, 'Unable to update Discord sync settings.');
  }

  private buildQuery<T extends Record<string, unknown>>(
    query?: Partial<T>,
  ): Record<string, unknown> | undefined {
    if (!query) {
      return undefined;
    }
    const entries = Object.entries(query).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    );
    return entries.length ? Object.fromEntries(entries) : undefined;
  }
}
