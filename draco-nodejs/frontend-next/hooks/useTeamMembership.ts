import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApiClient } from './useApiClient';
import { getAccountUserTeams } from '@draco/shared-api-client';
import { unwrapApiResult } from '../utils/apiResult';
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
    let ignore = false;

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
        const result = await getAccountUserTeams({
          client: apiClient,
          path: { accountId },
          throwOnError: false,
        });

        if (ignore) {
          return;
        }

        const payload = unwrapApiResult(result, 'Failed to load team memberships');
        const teams = Array.isArray(payload) ? (payload as TeamSeasonType[]) : [];

        const match = teams.find((team) => {
          if (!team || typeof team !== 'object') {
            return false;
          }

          return team.id === teamSeasonId;
        });

        setTeamSeason(match ?? null);
        setIsMember(Boolean(match));
      } catch (err) {
        if (ignore) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Failed to verify team membership';
        setError(message);
        setIsMember(false);
        setTeamSeason(null);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void checkMembership();

    return () => {
      ignore = true;
    };
  }, [accountId, apiClient, seasonId, teamSeasonId, token, user]);

  return { isMember, loading, error, teamSeason } as const;
}
