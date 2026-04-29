import { useState, useRef } from 'react';
import { getCurrentSeason } from '@draco/shared-api-client';
import { unwrapApiResult } from '../utils/apiResult';
import { useApiClient } from './useApiClient';

interface UseCurrentSeasonReturn {
  currentSeasonId: string | null;
  currentSeasonName: string | null;
  currentSeasonScheduleVisible: boolean | null;
  loading: boolean;
  error: string | null;
  fetchCurrentSeason: () => Promise<string>;
  refetchCurrentSeason: () => Promise<string>;
}

export const useCurrentSeason = (accountId: string): UseCurrentSeasonReturn => {
  const [currentSeasonId, setCurrentSeasonId] = useState<string | null>(null);
  const [currentSeasonName, setCurrentSeasonName] = useState<string | null>(null);
  const [currentSeasonScheduleVisible, setCurrentSeasonScheduleVisible] = useState<boolean | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiClient = useApiClient();

  const fetchPromiseRef = useRef<Promise<string> | null>(null);

  const depsRef = useRef({
    accountId,
    apiClient,
    currentSeasonId,
    setCurrentSeasonId,
    setCurrentSeasonName,
    setCurrentSeasonScheduleVisible,
    setLoading,
    setError,
  });
  depsRef.current = {
    accountId,
    apiClient,
    currentSeasonId,
    setCurrentSeasonId,
    setCurrentSeasonName,
    setCurrentSeasonScheduleVisible,
    setLoading,
    setError,
  };

  const [stableFns] = useState(() => {
    const doFetch = async (): Promise<string> => {
      const {
        accountId: aid,
        apiClient: client,
        setCurrentSeasonId: setSeasonId,
        setCurrentSeasonName: setSeasonName,
        setCurrentSeasonScheduleVisible: setScheduleVisible,
        setLoading: setLoad,
        setError: setErr,
      } = depsRef.current;

      try {
        setLoad(true);
        setErr(null);

        const result = await getCurrentSeason({
          client,
          path: { accountId: aid },
          throwOnError: false,
        });

        const season = unwrapApiResult(result, 'Failed to load current season');
        const seasonId = season.id;
        const seasonName = season.name;
        const scheduleVisible = season.scheduleVisible;

        setSeasonId(seasonId);
        setSeasonName(seasonName);
        setScheduleVisible(scheduleVisible);

        return seasonId;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load current season';
        setErr(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoad(false);
        fetchPromiseRef.current = null;
      }
    };

    const fetchCurrentSeason = (): Promise<string> => {
      if (depsRef.current.currentSeasonId) {
        return Promise.resolve(depsRef.current.currentSeasonId);
      }

      if (fetchPromiseRef.current) {
        return fetchPromiseRef.current;
      }

      const request = doFetch();
      fetchPromiseRef.current = request;
      return request;
    };

    const refetchCurrentSeason = (): Promise<string> => {
      if (fetchPromiseRef.current) {
        return fetchPromiseRef.current;
      }

      const request = doFetch();
      fetchPromiseRef.current = request;
      return request;
    };

    return { fetchCurrentSeason, refetchCurrentSeason };
  });

  return {
    currentSeasonId,
    currentSeasonName,
    currentSeasonScheduleVisible,
    loading,
    error,
    fetchCurrentSeason: stableFns.fetchCurrentSeason,
    refetchCurrentSeason: stableFns.refetchCurrentSeason,
  };
};
