'use client';

import { useState } from 'react';
import { getGolfPlayerDetailedStats } from '@draco/shared-api-client';
import type { GolfPlayerDetailedStatsType } from '@draco/shared-schemas';
import { useApiClient } from './useApiClient';

export type GolfPlayerStatsResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function useGolfPlayerStats(accountId: string) {
  const [loading, setLoading] = useState(false);
  const apiClient = useApiClient();

  const getPlayerDetailedStats = async (
    contactId: string,
    signal?: AbortSignal,
  ): Promise<GolfPlayerStatsResult<GolfPlayerDetailedStatsType>> => {
    setLoading(true);
    try {
      const result = await getGolfPlayerDetailedStats({
        client: apiClient,
        path: { accountId, contactId },
        signal,
        throwOnError: false,
      });

      if (result.error) {
        const errorObj = result.error as { message?: string };
        return {
          success: false,
          error: errorObj?.message ?? 'Failed to load player stats',
        };
      }

      if (result.data === undefined) {
        return { success: false, error: 'Failed to load player stats' };
      }

      return { success: true, data: result.data };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to load player stats',
      };
    } finally {
      setLoading(false);
    }
  };

  return { getPlayerDetailedStats, loading };
}
