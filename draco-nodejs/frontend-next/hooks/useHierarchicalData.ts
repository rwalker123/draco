'use client';

import { useState, useEffect } from 'react';
import { listSeasonLeagueSeasons } from '@draco/shared-api-client';
import { HierarchicalSeason } from '../types/emails/recipients';
import { useApiClient } from './useApiClient';
import { unwrapApiResult } from '../utils/apiResult';
import { mapLeagueSetup } from '../utils/leagueSeasonMapper';

export function useHierarchicalData(
  accountId: string | null | undefined,
  seasonId: string | null | undefined,
) {
  const [hierarchicalData, setHierarchicalData] = useState<HierarchicalSeason | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiClient = useApiClient();

  useEffect(() => {
    if (!accountId || !seasonId) return;

    const controller = new AbortController();

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await listSeasonLeagueSeasons({
          client: apiClient,
          path: { accountId, seasonId },
          query: {
            includeTeams: true,
            includeUnassignedTeams: false,
            includePlayerCounts: true,
            includeManagerCounts: true,
          },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

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
        if (controller.signal.aborted) return;
        console.error('Error loading hierarchical data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
        setError(errorMessage);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      controller.abort();
    };
  }, [accountId, seasonId, apiClient]);

  return {
    hierarchicalData,
    loading,
    error,
  };
}
