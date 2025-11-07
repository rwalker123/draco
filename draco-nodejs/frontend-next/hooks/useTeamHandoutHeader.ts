'use client';

import React from 'react';
import {
  getAccountUserTeams as apiGetAccountUserTeams,
  getTeamSeasonDetails as apiGetTeamSeasonDetails,
  listAccountSeasons as apiListAccountSeasons,
} from '@draco/shared-api-client';
import type { SeasonType, TeamSeasonRecordType, TeamSeasonType } from '@draco/shared-schemas';
import { unwrapApiResult } from '../utils/apiResult';
import { useApiClient } from './useApiClient';
import { useAuth } from '../context/AuthContext';

export interface TeamHandoutHeaderData {
  teamName: string;
  leagueName?: string;
  logoUrl?: string;
  teamId: string;
  teamSeasonId?: string | null;
  seasonId?: string | null;
}

interface UseTeamHandoutHeaderOptions {
  accountId?: string | null;
  seasonId?: string | null;
  teamSeasonId?: string | null;
  teamId?: string | null;
}

interface UseTeamHandoutHeaderResult {
  teamHeader: TeamHandoutHeaderData | null;
  loading: boolean;
  error: string | null;
  notMember: boolean;
}

export function useTeamHandoutHeader({
  accountId,
  seasonId,
  teamSeasonId,
  teamId,
}: UseTeamHandoutHeaderOptions): UseTeamHandoutHeaderResult {
  const apiClient = useApiClient();
  const { user, token } = useAuth();
  const [teamHeader, setTeamHeader] = React.useState<TeamHandoutHeaderData | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notMember, setNotMember] = React.useState<boolean>(false);

  React.useEffect(() => {
    let ignore = false;

    const resetState = () => {
      if (ignore) {
        return;
      }
      setTeamHeader(null);
      setError(null);
      setNotMember(false);
      setLoading(false);
    };

    const resolveTeamSeasonDetails = async (
      accountIdValue: string,
      teamSeasonIdValue: string,
    ): Promise<TeamSeasonRecordType | null> => {
      try {
        const seasonsResult = await apiListAccountSeasons({
          client: apiClient,
          path: { accountId: accountIdValue },
          query: { includeDivisions: false },
          throwOnError: false,
        });

        const seasons = unwrapApiResult<SeasonType[]>(
          seasonsResult,
          'Failed to load account seasons',
        );

        for (const season of seasons) {
          if (!season?.id) {
            continue;
          }

          try {
            const detailsResult = await apiGetTeamSeasonDetails({
              client: apiClient,
              path: {
                accountId: accountIdValue,
                seasonId: season.id,
                teamSeasonId: teamSeasonIdValue,
              },
              throwOnError: false,
            });

            const details = unwrapApiResult<TeamSeasonRecordType>(
              detailsResult,
              'Failed to load team information',
            );

            if (details) {
              return details;
            }
          } catch {
            // Ignore per-season lookup errors and continue searching remaining seasons
          }
        }
      } catch (seasonError) {
        console.warn(
          `Unable to resolve season context for team ${teamSeasonIdValue} in account ${accountIdValue}:`,
          seasonError,
        );
      }

      return null;
    };

    const fetchFromTeamSeason = async (
      accountIdValue: string,
      seasonIdValue: string,
      teamSeasonIdValue: string,
    ) => {
      setLoading(true);
      setError(null);
      setNotMember(false);

      try {
        const result = await apiGetTeamSeasonDetails({
          client: apiClient,
          path: {
            accountId: accountIdValue,
            seasonId: seasonIdValue,
            teamSeasonId: teamSeasonIdValue,
          },
          throwOnError: false,
        });

        if (ignore) {
          return;
        }

        const data = unwrapApiResult<TeamSeasonRecordType>(
          result,
          'Failed to load team information',
        );

        setTeamHeader({
          teamName: data.name ?? 'Team',
          leagueName: data.league?.name ?? undefined,
          logoUrl: data.team.logoUrl ?? undefined,
          teamId: data.team.id,
          teamSeasonId: teamSeasonIdValue,
          seasonId: seasonIdValue,
        });
      } catch (err) {
        if (ignore) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Failed to load team information';
        setError(message);
        setTeamHeader(null);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    const fetchFromTeamId = async (accountIdValue: string, teamIdValue: string) => {
      if (!user || !token) {
        setTeamHeader(null);
        setError(null);
        setNotMember(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setNotMember(false);

      try {
        const result = await apiGetAccountUserTeams({
          client: apiClient,
          path: { accountId: accountIdValue },
          throwOnError: false,
        });

        if (ignore) {
          return;
        }

        const payload = unwrapApiResult(result, 'Failed to load team memberships');
        const teams = Array.isArray(payload) ? (payload as TeamSeasonType[]) : [];

        const match = teams.find(
          (team) => team && typeof team === 'object' && team.team?.id === teamIdValue,
        );

        if (!match) {
          setTeamHeader(null);
          setError(null);
          setNotMember(true);
          return;
        }

        let resolvedTeamName = match.name ?? 'Team';
        let resolvedLeagueName = match.league?.name ?? undefined;
        let resolvedLogoUrl = match.team?.logoUrl ?? undefined;
        let resolvedSeasonId = match.season?.id ?? null;

        if (!resolvedSeasonId && match.id) {
          const resolvedDetails = await resolveTeamSeasonDetails(accountIdValue, match.id);

          if (ignore) {
            return;
          }

          if (resolvedDetails) {
            resolvedTeamName = resolvedDetails.name ?? resolvedTeamName;
            resolvedLeagueName = resolvedDetails.league?.name ?? resolvedLeagueName;
            resolvedLogoUrl = resolvedDetails.team.logoUrl ?? resolvedLogoUrl;
            resolvedSeasonId = resolvedDetails.season?.id ?? resolvedSeasonId;
          }
        }

        setTeamHeader({
          teamName: resolvedTeamName,
          leagueName: resolvedLeagueName,
          logoUrl: resolvedLogoUrl,
          teamId: match.team?.id ?? teamIdValue,
          teamSeasonId: match.id ?? null,
          seasonId: resolvedSeasonId,
        });
        setNotMember(false);
      } catch (err) {
        if (ignore) {
          return;
        }
        const message =
          err instanceof Error ? err.message : 'Failed to determine team membership information';
        setError(message);
        setTeamHeader(null);
        setNotMember(false);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    if (!accountId) {
      resetState();
    } else if (teamId) {
      void fetchFromTeamId(accountId, teamId);
    } else if (seasonId && teamSeasonId) {
      void fetchFromTeamSeason(accountId, seasonId, teamSeasonId);
    } else {
      resetState();
    }

    return () => {
      ignore = true;
    };
  }, [accountId, apiClient, seasonId, teamId, teamSeasonId, token, user]);

  return { teamHeader, loading, error, notMember };
}

export { useTeamHandoutHeader as useTeamResourceHeader };
