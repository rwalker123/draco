import { useState, useEffect, useCallback } from 'react';
import { getAdminDashboardSummary } from '@draco/shared-api-client';
import type { AdminDashboardSummaryType } from '@draco/shared-schemas';
import { unwrapApiResult } from '../utils/apiResult';
import { useApiClient } from './useApiClient';

interface UseAdminDashboardSummaryResult {
  summary: AdminDashboardSummaryType | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAdminDashboardSummary(accountId: string): UseAdminDashboardSummaryResult {
  const [summary, setSummary] = useState<AdminDashboardSummaryType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const apiClient = useApiClient();

  const fetchSummary = useCallback(
    async (signal?: AbortSignal) => {
      if (!accountId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getAdminDashboardSummary({
          client: apiClient,
          path: { accountId },
          throwOnError: false,
        });

        if (signal?.aborted) return;

        const data = unwrapApiResult(result, 'Failed to fetch dashboard summary');
        setSummary(data);
      } catch (err) {
        if (signal?.aborted) return;
        const message = err instanceof Error ? err.message : 'Failed to load dashboard summary';
        setError(message);
        setSummary(null);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [accountId, apiClient],
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchSummary(controller.signal);
    return () => controller.abort();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary,
  };
}
