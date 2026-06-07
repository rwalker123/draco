import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApiClient } from './useApiClient';
import { getUserTeamsCached } from '../lib/userTeamsCache';
import type { TeamSeasonType } from '@draco/shared-schemas';

export function useTeamMembership(
  accountId?: string | null,
  teamSeasonId?: string | null,
  seasonId?: string | null,
) {
  const { user, token } = useAuth();
  const apiClient = useApiClient();
  const [isMember, setIsMember] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamSeason, setTeamSeason] = useState<TeamSeasonType | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const checkMembership = async () => {
      if (!accountId || !teamSeasonId || !user || !token) {
        setLoading(false);
        setError(null);
        setIsMember(false);
        setTeamSeason(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const teams = await getUserTeamsCached(accountId, token, apiClient);

        if (controller.signal.aborted) {
          return;
        }

        const match = teams.find((team) => {
          if (!team || typeof team !== 'object') {
            return false;
          }

          return team.id === teamSeasonId;
        });

        setTeamSeason(match ?? null);
        setIsMember(Boolean(match));
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Failed to verify team membership';
        setError(message);
        setIsMember(false);
        setTeamSeason(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void checkMembership();

    return () => {
      controller.abort();
    };
  }, [accountId, apiClient, seasonId, teamSeasonId, token, user]);

  return { isMember, loading, error, teamSeason } as const;
}
