'use client';

import type {
  DiscordFeatureSyncFeatureType,
  DiscordFeatureSyncStatusType,
  DiscordFeatureSyncUpdateType,
} from '@draco/shared-schemas';
import { useApiClient } from './useApiClient';
import { DiscordIntegrationService } from '@/services/discordIntegrationService';

export const useDiscordFeatureSync = () => {
  const apiClient = useApiClient();
  const service = new DiscordIntegrationService(apiClient);

  const fetchStatus = (
    accountId: string,
    feature: DiscordFeatureSyncFeatureType,
  ): Promise<DiscordFeatureSyncStatusType> => service.getFeatureSyncStatus(accountId, feature);

  const updateStatus = (
    accountId: string,
    feature: DiscordFeatureSyncFeatureType,
    payload: DiscordFeatureSyncUpdateType,
  ): Promise<DiscordFeatureSyncStatusType> =>
    service.updateFeatureSync(accountId, feature, payload);

  return {
    fetchStatus,
    updateStatus,
  };
};

export type UseDiscordFeatureSyncReturn = ReturnType<typeof useDiscordFeatureSync>;
