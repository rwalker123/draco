import { useEffect, useState } from 'react';
import type { TeamSeasonType } from '@draco/shared-schemas';
import { useAuth } from '../context/AuthContext';
import { useApiClient } from './useApiClient';
import { clearUserTeamsCache, getUserTeamsCached } from '../lib/userTeamsCache';

export interface UseUserTeamsResult {
  teams: TeamSeasonType[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  isUserTeam: (teamSeasonId: string) => boolean;
  refetch: () => void;
}

export function useUserTeams(accountId?: string | null): UseUserTeamsResult {
  const { token } = useAuth();
  const apiClient = useApiClient();
  const [teams, setTeams] = useState<TeamSeasonType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!accountId || !token) {
      setTeams([]);
      setError(null);
      setLoading(false);
      setInitialized(true);
      return;
    }

    const controller = new AbortController();

    const loadTeams = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getUserTeamsCached(accountId, token, apiClient);

        if (controller.signal.aborted) {
          return;
        }

        setTeams(result);
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        setTeams([]);
        setError(err instanceof Error ? err.message : 'Failed to load team memberships');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    void loadTeams();

    return () => {
      controller.abort();
    };
  }, [accountId, token, apiClient, reloadKey]);

  const isUserTeam = (teamSeasonId: string): boolean =>
    teams.some((team) => team.id === teamSeasonId);

  const refetch = () => {
    if (accountId) {
      clearUserTeamsCache(accountId);
    }
    setReloadKey((key) => key + 1);
  };

  return { teams, loading, error, initialized, isUserTeam, refetch };
}
