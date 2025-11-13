'use client';

import { useCallback, useMemo } from 'react';
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
} from '@draco/shared-schemas';
import { useApiClient } from './useApiClient';
import { DiscordIntegrationService } from '@/services/discordIntegrationService';

export const useAccountDiscordAdmin = () => {
  const apiClient = useApiClient();
  const service = useMemo(() => new DiscordIntegrationService(apiClient), [apiClient]);

  const fetchConfig = useCallback(
    (accountId: string): Promise<DiscordAccountConfigType> => service.getAccountConfig(accountId),
    [service],
  );

  const updateConfig = useCallback(
    (accountId: string, payload: DiscordAccountConfigUpdateType) =>
      service.updateAccountConfig(accountId, payload),
    [service],
  );

  const disconnectGuild = useCallback(
    (accountId: string) => service.disconnectAccountGuild(accountId),
    [service],
  );

  const fetchRoleMappings = useCallback(
    (accountId: string): Promise<DiscordRoleMappingListType> => service.listRoleMappings(accountId),
    [service],
  );

  const createRoleMapping = useCallback(
    (accountId: string, payload: DiscordRoleMappingUpdateType): Promise<DiscordRoleMappingType> =>
      service.createRoleMapping(accountId, payload),
    [service],
  );

  const updateRoleMapping = useCallback(
    (accountId: string, roleMappingId: string, payload: DiscordRoleMappingUpdateType) =>
      service.updateRoleMapping(accountId, roleMappingId, payload),
    [service],
  );

  const deleteRoleMapping = useCallback(
    (accountId: string, roleMappingId: string) =>
      service.deleteRoleMapping(accountId, roleMappingId),
    [service],
  );

  const startInstall = useCallback(
    (accountId: string): Promise<DiscordOAuthStartResponseType> =>
      service.startBotInstall(accountId),
    [service],
  );

  const fetchAvailableChannels = useCallback(
    (accountId: string): Promise<DiscordGuildChannelType[]> =>
      service.listAvailableChannels(accountId),
    [service],
  );

  const fetchChannelMappings = useCallback(
    (accountId: string): Promise<DiscordChannelMappingListType> =>
      service.listChannelMappings(accountId),
    [service],
  );

  const createChannelMapping = useCallback(
    (
      accountId: string,
      payload: DiscordChannelMappingCreateType,
    ): Promise<DiscordChannelMappingType> => service.createChannelMapping(accountId, payload),
    [service],
  );

  const deleteChannelMapping = useCallback(
    (accountId: string, mappingId: string) => service.deleteChannelMapping(accountId, mappingId),
    [service],
  );

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
  };
};
