import { useState, useEffect } from 'react';
import { getAdminDashboardSummary } from '@draco/shared-api-client';
import type { AdminDashboardSummaryType } from '@draco/shared-schemas';
import { unwrapApiResult } from '../utils/apiResult';
import { useApiClient } from './useApiClient';

interface UseAdminDashboardSummaryResult {
  summary: AdminDashboardSummaryType | null;
  loading: boolean;
  error: string | null;
}

export function useAdminDashboardSummary(accountId: string): UseAdminDashboardSummaryResult {
  const [summary, setSummary] = useState<AdminDashboardSummaryType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const apiClient = useApiClient();

  useEffect(() => {
    if (!accountId) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchSummary = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getAdminDashboardSummary({
          client: apiClient,
          path: { accountId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        const data = unwrapApiResult(result, 'Failed to fetch dashboard summary');
        setSummary(data);
      } catch (err) {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Failed to load dashboard summary';
        setError(message);
        setSummary(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchSummary();

    return () => {
      controller.abort();
    };
  }, [accountId, apiClient]);

  return {
    summary,
    loading,
    error,
  };
}
