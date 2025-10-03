import { useState, useCallback } from 'react';
import { getCurrentSeason } from '@draco/shared-api-client';
import { unwrapApiResult } from '../utils/apiResult';
import { useApiClient } from './useApiClient';

interface UseCurrentSeasonReturn {
  currentSeasonId: string | null;
  currentSeasonName: string | null;
  loading: boolean;
  error: string | null;
  fetchCurrentSeason: () => Promise<string>;
}

/**
 * Custom hook to fetch and manage current season data
 * Eliminates duplication of current season fetching logic across components
 */
export const useCurrentSeason = (accountId: string): UseCurrentSeasonReturn => {
  const [currentSeasonId, setCurrentSeasonId] = useState<string | null>(null);
  const [currentSeasonName, setCurrentSeasonName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiClient = useApiClient();

  const fetchCurrentSeason = useCallback(async (): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

      const result = await getCurrentSeason({
        client: apiClient,
        path: { accountId },
        throwOnError: false,
      });

      const season = unwrapApiResult(result, 'Failed to load current season');
      const seasonId = season.id;
      const seasonName = season.name;

      setCurrentSeasonId(seasonId);
      setCurrentSeasonName(seasonName);

      return seasonId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load current season';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [accountId, apiClient]);

  return {
    currentSeasonId,
    currentSeasonName,
    loading,
    error,
    fetchCurrentSeason,
  };
};
