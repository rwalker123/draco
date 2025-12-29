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

  const fetchSummary = useCallback(async () => {
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

      const data = unwrapApiResult(result, 'Failed to fetch dashboard summary');
      setSummary(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard summary';
      setError(message);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [accountId, apiClient]);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
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

        if (ignore) return;

        const data = unwrapApiResult(result, 'Failed to fetch dashboard summary');
        setSummary(data);
      } catch (err) {
        if (ignore) return;
        const message = err instanceof Error ? err.message : 'Failed to load dashboard summary';
        setError(message);
        setSummary(null);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      ignore = true;
    };
  }, [accountId, apiClient]);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary,
  };
}
