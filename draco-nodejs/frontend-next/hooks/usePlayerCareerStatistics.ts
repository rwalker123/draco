import { useEffect, useState } from 'react';
import type { PlayerCareerStatisticsType } from '@draco/shared-schemas';
import { useApiClient } from './useApiClient';
import { fetchPlayerCareerStatistics, searchPublicContacts } from '../services/statisticsService';

export interface PlayerCareerSearchResult {
  playerId: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
}

interface UsePlayerCareerStatisticsOptions {
  accountId: string;
  initialResults?: PlayerCareerSearchResult[];
  playerId?: string;
  searchQuery?: string;
}

interface UsePlayerCareerStatisticsResult {
  searchResults: PlayerCareerSearchResult[];
  searchLoading: boolean;
  searchError: string | null;
  playerStats: PlayerCareerStatisticsType | null;
  playerLoading: boolean;
  playerError: string | null;
  resetPlayer: () => void;
}

export const usePlayerCareerStatistics = ({
  accountId,
  initialResults = [],
  playerId,
  searchQuery,
}: UsePlayerCareerStatisticsOptions): UsePlayerCareerStatisticsResult => {
  const apiClient = useApiClient();
  const [searchResults, setSearchResults] = useState<PlayerCareerSearchResult[]>(initialResults);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [playerStats, setPlayerStats] = useState<PlayerCareerStatisticsType | null>(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const hasActiveSearch = searchQuery !== undefined && searchQuery.trim().length > 0;
  const hasActivePlayer = playerId !== undefined && playerId.length > 0;

  useEffect(() => {
    if (!hasActiveSearch) return;

    let cancelled = false;

    const performSearch = async () => {
      const trimmedQuery = searchQuery.trim();
      setSearchLoading(true);
      setSearchError(null);

      try {
        const response = await searchPublicContacts(
          accountId,
          { query: trimmedQuery },
          { client: apiClient },
        );
        if (cancelled) return;
        const results: PlayerCareerSearchResult[] =
          response.results?.map((contact) => ({
            playerId: contact.id,
            firstName: contact.firstName,
            lastName: contact.lastName,
            photoUrl: contact.photoUrl ?? undefined,
          })) ?? [];
        setSearchResults(results);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Failed to search players';
        setSearchError(message);
        setSearchResults([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    };

    void performSearch();

    return () => {
      cancelled = true;
    };
  }, [hasActiveSearch, searchQuery, accountId, apiClient]);

  useEffect(() => {
    if (!hasActivePlayer) return;

    let cancelled = false;

    const loadPlayerStats = async () => {
      setPlayerLoading(true);
      setPlayerError(null);

      try {
        const stats = await fetchPlayerCareerStatistics(accountId, playerId, {
          client: apiClient,
        });
        if (cancelled) return;
        setPlayerStats(stats);
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : 'Failed to load player career statistics';
        setPlayerError(message);
        setPlayerStats(null);
      } finally {
        if (!cancelled) setPlayerLoading(false);
      }
    };

    void loadPlayerStats();

    return () => {
      cancelled = true;
    };
  }, [hasActivePlayer, playerId, accountId, apiClient]);

  const resetPlayer = () => {
    setPlayerStats(null);
    setPlayerError(null);
  };

  return {
    searchResults: hasActiveSearch ? searchResults : [],
    searchLoading: hasActiveSearch && searchLoading,
    searchError: hasActiveSearch ? searchError : null,
    playerStats: hasActivePlayer ? playerStats : null,
    playerLoading: hasActivePlayer && playerLoading,
    playerError: hasActivePlayer ? playerError : null,
    resetPlayer,
  };
};

export const formatPlayerDisplayName = (result: PlayerCareerSearchResult): string =>
  `${result.firstName.trim()} ${result.lastName.trim()}`.trim() || 'Unknown Player';
