'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

  const isMountedRef = useRef(true);

  const fetchCategories = useCallback(async () => {
    if (!accountId) {
      return {
        batting: [] as LeaderCategoryType[],
        pitching: [] as LeaderCategoryType[],
      };
    }

    const categories: LeaderCategoriesType = await fetchLeaderCategories(accountId, {
      client: apiClient,
    });

    return {
      batting: categories.batting ?? [],
      pitching: categories.pitching ?? [],
    };
  }, [accountId, apiClient]);

  const applyCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchCategories();

      if (!isMountedRef.current) {
        return;
      }

      setBattingCategories(result.batting);
      setPitchingCategories(result.pitching);
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }

      console.error('Error loading leader categories:', err);
      const message = err instanceof Error ? err.message : 'Failed to load leader categories';
      setError(message);
      setBattingCategories([]);
      setPitchingCategories([]);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchCategories]);

  useEffect(() => {
    isMountedRef.current = true;
    void applyCategories();
    return () => {
      isMountedRef.current = false;
    };
  }, [applyCategories]);

  return {
    battingCategories,
    pitchingCategories,
    loading,
    error,
    refetch: () => {
      void applyCategories();
    },
  };
}
