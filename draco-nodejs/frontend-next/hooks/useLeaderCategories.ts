'use client';

import { useEffect, useState } from 'react';
import type { LeaderCategoryType, LeaderCategoriesType } from '@draco/shared-schemas';
import { useApiClient } from './useApiClient';
import { fetchLeaderCategories } from '../services/statisticsService';

interface UseLeaderCategoriesResult {
  battingCategories: LeaderCategoryType[];
  pitchingCategories: LeaderCategoryType[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useLeaderCategories(
  accountId: string | null | undefined,
): UseLeaderCategoriesResult {
  const apiClient = useApiClient();
  const [battingCategories, setBattingCategories] = useState<LeaderCategoryType[]>([]);
  const [pitchingCategories, setPitchingCategories] = useState<LeaderCategoryType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!accountId) return;

    const controller = new AbortController();

    const loadCategories = async () => {
      setLoading(true);
      setError(null);

      try {
        const categories: LeaderCategoriesType = await fetchLeaderCategories(accountId, {
          client: apiClient,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        setBattingCategories(categories.batting ?? []);
        setPitchingCategories(categories.pitching ?? []);
      } catch (err) {
        if (controller.signal.aborted) return;

        console.error('Error loading leader categories:', err);
        const message = err instanceof Error ? err.message : 'Failed to load leader categories';
        setError(message);
        setBattingCategories([]);
        setPitchingCategories([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadCategories();

    return () => {
      controller.abort();
    };
  }, [accountId, apiClient, refreshKey]);

  return {
    battingCategories,
    pitchingCategories,
    loading,
    error,
    refetch: () => {
      setRefreshKey((prev) => prev + 1);
    },
  };
}
