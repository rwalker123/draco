'use client';

import type { DiscordLinkStatusType, DiscordOAuthStartResponseType } from '@draco/shared-schemas';
import { useApiClient } from './useApiClient';
import { DiscordIntegrationService } from '@/services/discordIntegrationService';

export const useDiscordIntegration = () => {
  const apiClient = useApiClient();
  const service = new DiscordIntegrationService(apiClient);

  const getLinkStatus = (accountId: string): Promise<DiscordLinkStatusType> =>
    service.getLinkStatus(accountId);

  const startLink = (accountId: string): Promise<DiscordOAuthStartResponseType> =>
    service.startLink(accountId);

  const unlinkDiscord = (accountId: string): Promise<DiscordLinkStatusType> =>
    service.unlinkAccount(accountId);

  return {
    getLinkStatus,
    startLink,
    unlinkDiscord,
  };
};
