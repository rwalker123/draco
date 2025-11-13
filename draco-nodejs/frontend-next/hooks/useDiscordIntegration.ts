'use client';

import { useCallback, useMemo } from 'react';
import type { DiscordLinkStatusType, DiscordOAuthStartResponseType } from '@draco/shared-schemas';
import { useApiClient } from './useApiClient';
import { DiscordIntegrationService } from '@/services/discordIntegrationService';

export const useDiscordIntegration = () => {
  const apiClient = useApiClient();
  const service = useMemo(() => new DiscordIntegrationService(apiClient), [apiClient]);

  const getLinkStatus = useCallback(
    (accountId: string): Promise<DiscordLinkStatusType> => service.getLinkStatus(accountId),
    [service],
  );

  const startLink = useCallback(
    (accountId: string): Promise<DiscordOAuthStartResponseType> => service.startLink(accountId),
    [service],
  );

  const unlinkDiscord = useCallback(
    (accountId: string): Promise<DiscordLinkStatusType> => service.unlinkAccount(accountId),
    [service],
  );

  return {
    getLinkStatus,
    startLink,
    unlinkDiscord,
  };
};
