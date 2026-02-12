'use client';

import { useEffect, useState } from 'react';
import {
  getGolfLeagueSetup,
  updateGolfLeagueSetup,
  GolfLeagueSetup,
  UpdateGolfLeagueSetup,
} from '@draco/shared-api-client';
import { useAuth } from '../context/AuthContext';
import { useApiClient } from './useApiClient';
import { unwrapApiResult } from '../utils/apiResult';

interface GolfLeagueSetupState {
  data: GolfLeagueSetup | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  updating: boolean;
}

export function useGolfLeagueSetup(
  accountId?: string | null,
  seasonId?: string | null,
  leagueSeasonId?: string | null,
) {
  const { token } = useAuth();
  const apiClient = useApiClient();
  const [state, setState] = useState<GolfLeagueSetupState>({
    data: null,
    loading: Boolean(accountId && seasonId && leagueSeasonId),
    error: null,
    initialized: false,
    updating: false,
  });

  const canRequest = Boolean(accountId && seasonId && leagueSeasonId && token);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!canRequest) {
      setState((previous) => ({
        ...previous,
        loading: false,
        initialized: true,
      }));
      return;
    }

    const controller = new AbortController();

    const fetchSetup = async (): Promise<void> => {
      setState((previous) => ({ ...previous, loading: true, error: null }));

      try {
        const result = await getGolfLeagueSetup({
          client: apiClient,
          path: {
            accountId: accountId as string,
            seasonId: seasonId as string,
            leagueSeasonId: leagueSeasonId as string,
          },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) return;

        if (result.response.status === 404) {
          setState((previous) => ({
            ...previous,
            data: null,
            error: null,
            loading: false,
            initialized: true,
          }));
          return;
        }

        const payload = unwrapApiResult(result, 'Failed to load golf league setup');

        setState((previous) => ({
          ...previous,
          data: payload ?? null,
          error: null,
        }));
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : 'Failed to load golf league setup';
        setState((previous) => ({
          ...previous,
          error: message,
        }));
      } finally {
        if (!controller.signal.aborted) {
          setState((previous) => ({
            ...previous,
            loading: false,
            initialized: true,
          }));
        }
      }
    };

    void fetchSetup();

    return () => {
      controller.abort();
    };
  }, [accountId, seasonId, leagueSeasonId, canRequest, apiClient, refreshKey]);

  const updateSetup = async (updates: UpdateGolfLeagueSetup): Promise<void> => {
    if (!canRequest) {
      throw new Error('Authentication is required to update golf league setup.');
    }

    setState((previous) => ({
      ...previous,
      updating: true,
      error: null,
    }));

    try {
      const result = await updateGolfLeagueSetup({
        client: apiClient,
        path: {
          accountId: accountId as string,
          seasonId: seasonId as string,
          leagueSeasonId: leagueSeasonId as string,
        },
        body: updates,
        throwOnError: false,
      });

      unwrapApiResult(result, 'Failed to update golf league setup');
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update golf league setup';
      setState((previous) => ({
        ...previous,
        error: message,
      }));
      throw new Error(message);
    } finally {
      setState((previous) => ({
        ...previous,
        updating: false,
      }));
    }
  };

  const clearError = () => {
    setState((previous) => ({ ...previous, error: null }));
  };

  return {
    setup: state.data,
    loading: state.loading && !state.initialized,
    refreshing: state.loading && state.initialized,
    updating: state.updating,
    error: state.error,
    updateSetup,
    clearError,
  };
}
