'use client';

import { useEffect, useState } from 'react';
import {
  getTeamRosterWaiverSummaries,
  type TeamRosterWaiverSummaries,
} from '@draco/shared-api-client';
import { useApiClient } from '../../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../../utils/apiResult';
import { type TeamOption } from './useSeasonLeaguesAndTeams';

export type WaiverMember = TeamRosterWaiverSummaries['members'][number];

export interface TeamWaiverData {
  teamSeasonId: string;
  members: WaiverMember[];
}

interface UseLeagueWaiverDataResult {
  teamWaiverData: TeamWaiverData[];
  loading: boolean;
  error: string | null;
}

export function useLeagueWaiverData(
  accountId: string,
  seasonId: string | null,
  leagueSeasonId: string,
  teamsByLeague: Map<string, TeamOption[]>,
): UseLeagueWaiverDataResult {
  const apiClient = useApiClient();
  const [teamWaiverData, setTeamWaiverData] = useState<TeamWaiverData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId || !seasonId || !leagueSeasonId) {
      setTeamWaiverData([]);
      setLoading(false);
      setError(null);
      return;
    }

    const teams = teamsByLeague.get(leagueSeasonId) ?? [];

    if (teams.length === 0) {
      setTeamWaiverData([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.all(
          teams.map((team) =>
            getTeamRosterWaiverSummaries({
              client: apiClient,
              path: {
                accountId,
                seasonId,
                teamSeasonId: team.teamSeasonId,
              },
              signal: controller.signal,
              throwOnError: false,
            }),
          ),
        );

        if (controller.signal.aborted) return;

        const data: TeamWaiverData[] = results.map((result, index) => {
          const teamData = unwrapApiResult(result, 'Failed to load roster');
          return {
            teamSeasonId: teams[index].teamSeasonId,
            members: teamData.members,
          };
        });

        setTeamWaiverData(data);
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load roster data');
        setTeamWaiverData([]);
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
  }, [accountId, seasonId, leagueSeasonId, teamsByLeague, apiClient]);

  return { teamWaiverData, loading, error };
}
