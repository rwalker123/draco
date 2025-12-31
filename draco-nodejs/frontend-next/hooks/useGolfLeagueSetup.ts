'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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

export function useGolfLeagueSetup(accountId?: string | null) {
  const { token } = useAuth();
  const apiClient = useApiClient();
  const [state, setState] = useState<GolfLeagueSetupState>({
    data: null,
    loading: Boolean(accountId),
    error: null,
    initialized: false,
    updating: false,
  });

  const canRequest = Boolean(accountId && token);

  const fetchSetup = useCallback(async (): Promise<void> => {
    if (!canRequest) {
      setState((previous) => ({
        ...previous,
        loading: false,
        initialized: true,
      }));
      return;
    }

    setState((previous) => ({ ...previous, loading: true, error: null }));

    try {
      const result = await getGolfLeagueSetup({
        client: apiClient,
        path: { accountId: accountId as string },
        throwOnError: false,
      });

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
      const message = error instanceof Error ? error.message : 'Failed to load golf league setup';
      setState((previous) => ({
        ...previous,
        error: message,
      }));
    } finally {
      setState((previous) => ({
        ...previous,
        loading: false,
        initialized: true,
      }));
    }
  }, [accountId, apiClient, canRequest]);

  useEffect(() => {
    const load = async () => {
      try {
        await fetchSetup();
      } catch {
        // errors are handled inside fetchSetup
      }
    };

    void load();
  }, [fetchSetup]);

  const updateSetup = useCallback(
    async (updates: UpdateGolfLeagueSetup): Promise<void> => {
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
          path: { accountId: accountId as string },
          body: updates,
          throwOnError: false,
        });

        unwrapApiResult(result, 'Failed to update golf league setup');
        await fetchSetup();
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
    },
    [accountId, apiClient, canRequest, fetchSetup],
  );

  const clearError = useCallback(() => {
    setState((previous) => ({ ...previous, error: null }));
  }, []);

  return useMemo(
    () => ({
      setup: state.data,
      loading: state.loading && !state.initialized,
      refreshing: state.loading && state.initialized,
      updating: state.updating,
      error: state.error,
      updateSetup,
      refetch: fetchSetup,
      clearError,
    }),
    [clearError, fetchSetup, state, updateSetup],
  );
}
