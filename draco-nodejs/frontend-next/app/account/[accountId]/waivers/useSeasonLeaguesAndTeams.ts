import { useEffect, useState } from 'react';
import { listSeasonLeagueSeasons } from '@draco/shared-api-client';
import { useApiClient } from '../../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../../utils/apiResult';

export interface LeagueOption {
  leagueSeasonId: string;
  leagueName: string;
}

export interface TeamOption {
  teamSeasonId: string;
  teamName: string;
  leagueSeasonId: string;
}

interface UseSeasonLeaguesAndTeamsResult {
  leagues: LeagueOption[];
  teamsByLeague: Map<string, TeamOption[]>;
  loading: boolean;
  error: string | null;
}

export function useSeasonLeaguesAndTeams(
  accountId: string,
  seasonId: string | null,
): UseSeasonLeaguesAndTeamsResult {
  const apiClient = useApiClient();
  const [leagues, setLeagues] = useState<LeagueOption[]>([]);
  const [teamsByLeague, setTeamsByLeague] = useState<Map<string, TeamOption[]>>(() => new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId || !seasonId) {
      setLeagues([]);
      setTeamsByLeague(new Map());
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await listSeasonLeagueSeasons({
          client: apiClient,
          path: { accountId, seasonId },
          query: { includeTeams: true },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;
        const data = unwrapApiResult(result, 'Failed to load leagues');

        const leagueOptions: LeagueOption[] = [];
        const teamsMap = new Map<string, TeamOption[]>();

        for (const leagueSeason of data.leagueSeasons ?? []) {
          leagueOptions.push({
            leagueSeasonId: leagueSeason.id,
            leagueName: leagueSeason.league.name,
          });
          const teams: TeamOption[] = [];
          for (const division of leagueSeason.divisions ?? []) {
            for (const team of division.teams) {
              teams.push({
                teamSeasonId: team.id,
                teamName: team.name ?? 'Unknown Team',
                leagueSeasonId: leagueSeason.id,
              });
            }
          }
          for (const team of leagueSeason.unassignedTeams ?? []) {
            teams.push({
              teamSeasonId: team.id,
              teamName: team.name ?? 'Unknown Team',
              leagueSeasonId: leagueSeason.id,
            });
          }
          teams.sort((a, b) => a.teamName.localeCompare(b.teamName));
          teamsMap.set(leagueSeason.id, teams);
        }

        leagueOptions.sort((a, b) => a.leagueName.localeCompare(b.leagueName));

        setLeagues(leagueOptions);
        setTeamsByLeague(teamsMap);
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load leagues');
        setLeagues([]);
        setTeamsByLeague(new Map());
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
  }, [accountId, seasonId, apiClient]);

  return { leagues, teamsByLeague, loading, error };
}
