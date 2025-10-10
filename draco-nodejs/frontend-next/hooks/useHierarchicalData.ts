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
            includeUnassignedTeams: false,
            includePlayerCounts: true,
            includeManagerCounts: true,
          },
          throwOnError: false,
        });

        const data = unwrapApiResult(result, 'Failed to load hierarchical data');
        const mapped = mapLeagueSetup(data);

        mapped.season = mapped.season ?? {
          id: seasonId,
          name: 'Season',
          accountId,
        };

        const transformedData: HierarchicalSeason = {
          id: mapped.season.id,
          name: mapped.season.name || 'Season',
          totalPlayers: 0,
          totalManagers: 0,
          leagues: mapped.leagueSeasons.map((league) => {
            const divisions = league.divisions?.sort(
              (a, b) => a.priority - b.priority || a.division.name.localeCompare(b.division.name),
            );

            return {
              ...league,
              divisions,
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
