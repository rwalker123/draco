'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LeaderRowType } from '@draco/shared-schemas';
import { useApiClient } from './useApiClient';
import { fetchStatisticalLeaders } from '../services/statisticsService';

interface UseStatisticalLeadersParams {
  accountId: string | null | undefined;
  leagueId: string | null | undefined;
  categoryKey: string | null | undefined;
  divisionId?: string;
  teamId?: string;
  isHistorical?: boolean;
  includeAllGameTypes?: boolean;
  limit?: number;
  enabled?: boolean;
}

interface UseStatisticalLeadersResult {
  leaders: LeaderRowType[];
  loading: boolean;
  error: string | null;
  resolvedCacheKey: string | null;
  refetch: () => void;
  isReady: boolean;
}

export function useStatisticalLeaders({
  accountId,
  leagueId,
  categoryKey,
  divisionId,
  teamId,
  isHistorical,
  includeAllGameTypes,
  limit,
  enabled = true,
}: UseStatisticalLeadersParams): UseStatisticalLeadersResult {
  const apiClient = useApiClient();
  const [leaders, setLeaders] = useState<LeaderRowType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedCacheKey, setResolvedCacheKey] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const cacheRef = useRef<Map<string, LeaderRowType[]>>(new Map());
  const inflightRef = useRef<Map<string, Promise<LeaderRowType[]>>>(new Map());

  const canLoad = useMemo(() => {
    return Boolean(accountId && leagueId && categoryKey && enabled);
  }, [accountId, leagueId, categoryKey, enabled]);

  const cacheKey = useMemo(() => {
    if (!canLoad) {
      return null;
    }
    return JSON.stringify({
      accountId,
      leagueId,
      categoryKey,
      divisionId: divisionId ?? null,
      teamId: teamId ?? null,
      isHistorical: isHistorical ?? null,
      includeAllGameTypes: includeAllGameTypes ?? null,
      limit: limit ?? null,
    });
  }, [
    accountId,
    canLoad,
    categoryKey,
    divisionId,
    includeAllGameTypes,
    isHistorical,
    leagueId,
    limit,
    teamId,
  ]);

  const loadLeaders = useCallback(async () => {
    if (!canLoad || !cacheKey) {
      console.debug('[useStatisticalLeaders] skipping load', {
        canLoad,
        cacheKey,
        accountId,
        leagueId,
        categoryKey,
      });
      setLeaders([]);
      setError(null);
      setLoading(false);
      setResolvedCacheKey(null);
      return;
    }

    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      console.debug('[useStatisticalLeaders] using cached leaders', {
        cacheKey,
        length: cached.length,
      });
      if (isMountedRef.current) {
        setLeaders(cached);
        setError(null);
        setLoading(false);
        setResolvedCacheKey(cacheKey);
      }
      return;
    }

    let inflight = inflightRef.current.get(cacheKey);
    if (!inflight) {
      console.debug('[useStatisticalLeaders] fetching leaders', {
        accountId,
        leagueId,
        categoryKey,
        cacheKey,
      });
      inflight = fetchStatisticalLeaders(
        accountId as string,
        leagueId as string,
        categoryKey as string,
        {
          divisionId,
          teamId,
          isHistorical,
          includeAllGameTypes,
          limit,
        },
        { client: apiClient },
      );
      inflightRef.current.set(cacheKey, inflight);
    }

    setLoading(true);
    setError(null);

    try {
      const result = await inflight;
      console.debug('[useStatisticalLeaders] leaders fetched', {
        cacheKey,
        length: result.length,
      });
      cacheRef.current.set(cacheKey, result);

      if (!isMountedRef.current) {
        return;
      }

      setLeaders(result);
      setResolvedCacheKey(cacheKey);
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }

      console.error('Failed to load statistical leaders:', err);
      const message = err instanceof Error ? err.message : 'Failed to load statistical leaders';
      setError(message);
      setLeaders([]);
      setResolvedCacheKey(null);
    } finally {
      if (inflightRef.current.get(cacheKey) === inflight) {
        inflightRef.current.delete(cacheKey);
      }
      if (isMountedRef.current) {
        console.debug('[useStatisticalLeaders] load completed', {
          cacheKey,
          loading: false,
        });
        setLoading(false);
      }
    }
  }, [
    accountId,
    apiClient,
    canLoad,
    categoryKey,
    divisionId,
    includeAllGameTypes,
    isHistorical,
    leagueId,
    cacheKey,
    limit,
    teamId,
  ]);

  useEffect(() => {
    isMountedRef.current = true;
    void loadLeaders();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadLeaders]);

  return {
    leaders,
    loading,
    error,
    resolvedCacheKey,
    refetch: () => {
      if (cacheKey) {
        cacheRef.current.delete(cacheKey);
      }
      void loadLeaders();
    },
    isReady: canLoad,
  };
}
