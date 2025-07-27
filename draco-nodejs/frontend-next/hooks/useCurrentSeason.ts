import { useState, useCallback } from 'react';

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

  const fetchCurrentSeason = useCallback(async (): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/accounts/${accountId}/seasons/current`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load current season');
      }

      const data = await response.json();
      const seasonId = data.data.season.id;
      const seasonName = data.data.season.name;

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
  }, [accountId]);

  return {
    currentSeasonId,
    currentSeasonName,
    loading,
    error,
    fetchCurrentSeason,
  };
};
