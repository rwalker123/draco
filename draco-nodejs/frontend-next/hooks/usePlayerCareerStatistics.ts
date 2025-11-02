import { useCallback, useState } from 'react';
import type { PlayerCareerStatisticsType } from '@draco/shared-schemas';
import { useApiClient } from './useApiClient';
import {
  fetchPlayerCareerStatistics,
  searchPublicContacts,
  type PublicContactSearchParams,
} from '../services/statisticsService';

export interface PlayerCareerSearchResult {
  playerId: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
}

interface UsePlayerCareerStatisticsOptions {
  accountId: string;
  initialResults?: PlayerCareerSearchResult[];
}

interface UsePlayerCareerStatisticsResult {
  searchResults: PlayerCareerSearchResult[];
  searchLoading: boolean;
  searchError: string | null;
  searchPlayers: (params: PublicContactSearchParams) => Promise<PlayerCareerSearchResult[]>;
  playerStats: PlayerCareerStatisticsType | null;
  playerLoading: boolean;
  playerError: string | null;
  loadPlayer: (playerId: string) => Promise<PlayerCareerStatisticsType | null>;
  resetPlayer: () => void;
}

export const usePlayerCareerStatistics = ({
  accountId,
  initialResults = [],
}: UsePlayerCareerStatisticsOptions): UsePlayerCareerStatisticsResult => {
  const apiClient = useApiClient();
  const [searchResults, setSearchResults] = useState<PlayerCareerSearchResult[]>(initialResults);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [playerStats, setPlayerStats] = useState<PlayerCareerStatisticsType | null>(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const searchPlayers = useCallback(
    async (params: PublicContactSearchParams): Promise<PlayerCareerSearchResult[]> => {
      const trimmedQuery = params.query.trim();
      if (trimmedQuery.length === 0) {
        setSearchResults([]);
        setSearchError(null);
        return [];
      }

      setSearchLoading(true);
      setSearchError(null);

      try {
        const response = await searchPublicContacts(
          accountId,
          { ...params, query: trimmedQuery },
          { client: apiClient },
        );

        const results: PlayerCareerSearchResult[] =
          response.results?.map((contact) => ({
            playerId: contact.id,
            firstName: contact.firstName,
            lastName: contact.lastName,
            photoUrl: contact.photoUrl ?? undefined,
          })) ?? [];

        setSearchResults(results);
        return results;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to search players';
        setSearchError(message);
        setSearchResults([]);
        return [];
      } finally {
        setSearchLoading(false);
      }
    },
    [accountId, apiClient],
  );

  const loadPlayer = useCallback(
    async (playerId: string): Promise<PlayerCareerStatisticsType | null> => {
      if (!playerId) {
        setPlayerStats(null);
        return null;
      }

      setPlayerLoading(true);
      setPlayerError(null);

      try {
        const stats = await fetchPlayerCareerStatistics(accountId, playerId, { client: apiClient });
        setPlayerStats(stats);
        return stats;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to load player career statistics';
        setPlayerError(message);
        setPlayerStats(null);
        return null;
      } finally {
        setPlayerLoading(false);
      }
    },
    [accountId, apiClient],
  );

  const resetPlayer = useCallback(() => {
    setPlayerStats(null);
    setPlayerError(null);
  }, []);

  return {
    searchResults,
    searchLoading,
    searchError,
    searchPlayers,
    playerStats,
    playerLoading,
    playerError,
    loadPlayer,
    resetPlayer,
  };
};

export const formatPlayerDisplayName = (result: PlayerCareerSearchResult): string =>
  `${result.firstName.trim()} ${result.lastName.trim()}`.trim() || 'Unknown Player';
