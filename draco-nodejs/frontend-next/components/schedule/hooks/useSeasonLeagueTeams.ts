import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useApiClient } from '../../../hooks/useApiClient';
import { League } from '@/types/schedule';
import { TeamSeasonType } from '@draco/shared-schemas';
import { getSportAdapter } from '../adapters';

interface UseSeasonLeagueTeamsProps {
  accountId: string;
  seasonId: string;
  accountType?: string;
  onError?: (message: string) => void;
}

interface UseSeasonLeagueTeamsReturn {
  leagues: League[];
  leagueTeamsCache: Map<string, TeamSeasonType[]>;
  loading: boolean;
}

export const useSeasonLeagueTeams = ({
  accountId,
  seasonId,
  accountType,
  onError,
}: UseSeasonLeagueTeamsProps): UseSeasonLeagueTeamsReturn => {
  const { loading: authLoading } = useAuth();
  const apiClient = useApiClient();
  const adapter = getSportAdapter(accountType);

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const [leagues, setLeagues] = useState<League[]>([]);
  const [leagueTeamsCache, setLeagueTeamsCache] = useState<Map<string, TeamSeasonType[]>>(
    () => new Map(),
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading || !accountId || !seasonId) {
      return;
    }

    if (!adapter.loadTeams) {
      setLeagues([]);
      setLeagueTeamsCache(new Map());
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const run = async () => {
      try {
        setLoading(true);
        const { leagues: loadedLeagues, leagueTeamsCache: loadedCache } = await adapter.loadTeams!({
          accountId,
          seasonId,
          apiClient,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;
        setLeagues(loadedLeagues);
        setLeagueTeamsCache(loadedCache);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.warn('Failed to load season league teams:', err);
        setLeagues([]);
        setLeagueTeamsCache(new Map());
        onErrorRef.current?.('Unable to load team data for this season.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      controller.abort();
    };
  }, [authLoading, accountId, seasonId, apiClient, adapter]);

  return {
    leagues,
    leagueTeamsCache,
    loading,
  };
};
