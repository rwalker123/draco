'use client';

import type {
  DiscordAccountConfigType,
  DiscordAccountConfigUpdateType,
  DiscordOAuthStartResponseType,
  DiscordRoleMappingListType,
  DiscordRoleMappingType,
  DiscordRoleMappingUpdateType,
  DiscordChannelMappingListType,
  DiscordChannelMappingType,
  DiscordChannelMappingCreateType,
  DiscordGuildChannelType,
  DiscordTeamForumListType,
  DiscordTeamForumQueryType,
  DiscordTeamForumRepairResultType,
} from '@draco/shared-schemas';
import { useApiClient } from './useApiClient';
import { DiscordIntegrationService } from '@/services/discordIntegrationService';

export const useAccountDiscordAdmin = () => {
  const apiClient = useApiClient();
  const service = new DiscordIntegrationService(apiClient);

  const fetchConfig = (accountId: string): Promise<DiscordAccountConfigType> =>
    service.getAccountConfig(accountId);

  const updateConfig = (accountId: string, payload: DiscordAccountConfigUpdateType) =>
    service.updateAccountConfig(accountId, payload);

  const disconnectGuild = (accountId: string) => service.disconnectAccountGuild(accountId);

  const fetchRoleMappings = (accountId: string): Promise<DiscordRoleMappingListType> =>
    service.listRoleMappings(accountId);

  const createRoleMapping = (
    accountId: string,
    payload: DiscordRoleMappingUpdateType,
  ): Promise<DiscordRoleMappingType> => service.createRoleMapping(accountId, payload);

  const updateRoleMapping = (
    accountId: string,
    roleMappingId: string,
    payload: DiscordRoleMappingUpdateType,
  ) => service.updateRoleMapping(accountId, roleMappingId, payload);

  const deleteRoleMapping = (accountId: string, roleMappingId: string) =>
    service.deleteRoleMapping(accountId, roleMappingId);

  const startInstall = (accountId: string): Promise<DiscordOAuthStartResponseType> =>
    service.startBotInstall(accountId);

  const fetchAvailableChannels = (accountId: string): Promise<DiscordGuildChannelType[]> =>
    service.listAvailableChannels(accountId);

  const fetchChannelMappings = (accountId: string): Promise<DiscordChannelMappingListType> =>
    service.listChannelMappings(accountId);

  const createChannelMapping = (
    accountId: string,
    payload: DiscordChannelMappingCreateType,
  ): Promise<DiscordChannelMappingType> => service.createChannelMapping(accountId, payload);

  const deleteChannelMapping = (accountId: string, mappingId: string) =>
    service.deleteChannelMapping(accountId, mappingId);

  const fetchTeamForums = (
    accountId: string,
    query?: Partial<DiscordTeamForumQueryType>,
  ): Promise<DiscordTeamForumListType> => service.listTeamForums(accountId, query);

  const repairTeamForums = (accountId: string): Promise<DiscordTeamForumRepairResultType> =>
    service.repairTeamForums(accountId);

  return {
    fetchConfig,
    updateConfig,
    disconnectGuild,
    fetchRoleMappings,
    createRoleMapping,
    updateRoleMapping,
    deleteRoleMapping,
    startInstall,
    fetchAvailableChannels,
    fetchChannelMappings,
    createChannelMapping,
    deleteChannelMapping,
    fetchTeamForums,
    repairTeamForums,
  };
};
