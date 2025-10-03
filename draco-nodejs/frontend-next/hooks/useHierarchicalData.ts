'use client';

import { useState, useCallback } from 'react';
import { listSeasonLeagueSeasons } from '@draco/shared-api-client';
import { HierarchicalSeason } from '../types/emails/recipients';
import { useApiClient } from './useApiClient';
import { unwrapApiResult } from '../utils/apiResult';
import { mapLeagueSetup } from '../utils/leagueSeasonMapper';

export function useHierarchicalData() {
  const [hierarchicalData, setHierarchicalData] = useState<HierarchicalSeason | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiClient = useApiClient();

  const loadHierarchicalData = useCallback(
    async (accountId: string, seasonId: string) => {
      if (!accountId || !seasonId) return;

      try {
        setLoading(true);
        setError(null);

        const result = await listSeasonLeagueSeasons({
          client: apiClient,
          path: { accountId, seasonId },
          query: {
            includeTeams: true,
            includeUnassignedTeams: true,
            includePlayerCounts: true,
            includeManagerCounts: true,
          },
          throwOnError: false,
        });

        const data = unwrapApiResult(result, 'Failed to load hierarchical data');
        const mapped = mapLeagueSetup(data, accountId);

        const seasonInfo = mapped.season ?? {
          id: seasonId,
          name: 'Season',
          accountId,
        };

        const transformedData: HierarchicalSeason = {
          id: seasonInfo.id,
          name: seasonInfo.name || 'Season',
          totalPlayers: 0,
          totalManagers: 0,
          leagues: mapped.leagueSeasons.map((league) => {
            const divisions = league.divisions
              .map((division) => ({
                id: division.divisionId,
                name: division.divisionName,
                priority: division.priority,
                totalPlayers: division.totalPlayers,
                totalManagers: division.totalManagers,
                teams: division.teams.map((team) => ({
                  id: team.id,
                  name: team.name,
                  playerCount: team.playerCount ?? 0,
                  managerCount: team.managerCount ?? 0,
                })),
              }))
              .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));

            const unassignedTeams = league.unassignedTeams.map((team) => ({
              id: team.id,
              name: team.name,
              playerCount: team.playerCount ?? 0,
              managerCount: team.managerCount ?? 0,
            }));

            const totalPlayers = league.totalPlayers;
            const totalManagers = league.totalManagers;

            return {
              id: league.id,
              name: league.leagueName,
              divisions,
              unassignedTeams,
              totalPlayers,
              totalManagers,
            };
          }),
        };

        transformedData.totalPlayers = transformedData.leagues.reduce(
          (sum, league) => sum + (league.totalPlayers || 0),
          0,
        );
        transformedData.totalManagers = transformedData.leagues.reduce(
          (sum, league) => sum + (league.totalManagers || 0),
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
    },
    [apiClient],
  );

  return {
    hierarchicalData,
    loading,
    error,
    loadHierarchicalData,
  };
}
