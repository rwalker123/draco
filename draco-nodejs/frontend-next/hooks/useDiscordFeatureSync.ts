'use client';

import { useCallback, useMemo } from 'react';
import type {
  DiscordFeatureSyncFeatureType,
  DiscordFeatureSyncStatusType,
  DiscordFeatureSyncUpdateType,
} from '@draco/shared-schemas';
import { useApiClient } from './useApiClient';
import { DiscordIntegrationService } from '@/services/discordIntegrationService';

export const useDiscordFeatureSync = () => {
  const apiClient = useApiClient();
  const service = useMemo(() => new DiscordIntegrationService(apiClient), [apiClient]);

  const fetchStatus = useCallback(
    (
      accountId: string,
      feature: DiscordFeatureSyncFeatureType,
    ): Promise<DiscordFeatureSyncStatusType> => service.getFeatureSyncStatus(accountId, feature),
    [service],
  );

  const updateStatus = useCallback(
    (
      accountId: string,
      feature: DiscordFeatureSyncFeatureType,
      payload: DiscordFeatureSyncUpdateType,
    ): Promise<DiscordFeatureSyncStatusType> =>
      service.updateFeatureSync(accountId, feature, payload),
    [service],
  );

  return {
    fetchStatus,
    updateStatus,
  };
};

export type UseDiscordFeatureSyncReturn = ReturnType<typeof useDiscordFeatureSync>;
