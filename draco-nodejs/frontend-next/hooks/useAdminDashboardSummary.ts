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

    let cancelled = false;

    const fetchSummary = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getAdminDashboardSummary({
          client: apiClient,
          path: { accountId },
          throwOnError: false,
        });

        if (cancelled) return;

        const data = unwrapApiResult(result, 'Failed to fetch dashboard summary');
        setSummary(data);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load dashboard summary';
        setError(message);
        setSummary(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchSummary();

    return () => {
      cancelled = true;
    };
  }, [accountId, apiClient]);

  return {
    summary,
    loading,
    error,
  };
}
