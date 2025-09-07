'use client';

import { useState, useCallback } from 'react';
import { HierarchicalSeason } from '../types/emails/recipients';
import { apiRequest } from '../utils/apiClient';
import { withRetry } from '../utils/errorHandling';

// API Response Types
interface ApiTeamResponse {
  id: string;
  name: string;
  playerCount?: number;
}

interface ApiDivisionResponse {
  id: string;
  divisionName: string;
  priority: number;
  teams?: ApiTeamResponse[];
}

interface ApiLeagueSeasonResponse {
  id: string;
  leagueName: string;
  divisions?: ApiDivisionResponse[];
  unassignedTeams?: ApiTeamResponse[];
}

interface ApiSeasonResponse {
  id: string;
  name: string;
}

interface ApiDataResponse {
  leagueSeasons: ApiLeagueSeasonResponse[];
  season?: ApiSeasonResponse;
}

interface ApiResponse {
  success: boolean;
  data: ApiDataResponse;
}

export function useHierarchicalData() {
  const [hierarchicalData, setHierarchicalData] = useState<HierarchicalSeason | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHierarchicalData = useCallback(async (accountId: string, seasonId: string) => {
    if (!accountId || !seasonId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await withRetry(() =>
        apiRequest<ApiResponse>(
          `/api/accounts/${accountId}/seasons/${seasonId}/leagues?includeTeams=true&includePlayerCounts=true`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to load hierarchical data');
      }

      const data = result.data;

      if (!data.success || !data.data?.leagueSeasons) {
        throw new Error('Invalid response format');
      }

      // Transform API response to hierarchical structure
      const transformedData: HierarchicalSeason = {
        id: seasonId,
        name: data.data.season?.name || 'Season',
        totalPlayers: 0,
        leagues: data.data.leagueSeasons.map((league: ApiLeagueSeasonResponse) => {
          let leagueTotalPlayers = 0;

          const divisions = (league.divisions || []).map((division: ApiDivisionResponse) => {
            const divisionTotalPlayers = (division.teams || []).reduce(
              (sum: number, team: ApiTeamResponse) => sum + (team.playerCount || 0),
              0,
            );
            leagueTotalPlayers += divisionTotalPlayers;

            return {
              id: division.id,
              name: division.divisionName,
              priority: division.priority,
              totalPlayers: divisionTotalPlayers,
              teams: (division.teams || []).map((team: ApiTeamResponse) => ({
                id: team.id,
                name: team.name,
                playerCount: team.playerCount || 0,
              })),
            };
          });

          const unassignedTeams = (league.unassignedTeams || []).map((team: ApiTeamResponse) => {
            leagueTotalPlayers += team.playerCount || 0;
            return {
              id: team.id,
              name: team.name,
              playerCount: team.playerCount || 0,
            };
          });

          return {
            id: league.id,
            name: league.leagueName,
            totalPlayers: leagueTotalPlayers,
            divisions: divisions.sort((a, b) => a.priority - b.priority),
            unassignedTeams,
          };
        }),
      };

      // Calculate total players for the season
      transformedData.totalPlayers = transformedData.leagues.reduce(
        (sum, league) => sum + (league.totalPlayers || 0),
        0,
      );

      setHierarchicalData(transformedData);
    } catch (err) {
      console.error('Error loading hierarchical data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    hierarchicalData,
    loading,
    error,
    loadHierarchicalData,
  };
}
