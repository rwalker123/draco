'use client';

import { useCallback, useState } from 'react';
import { createAccountUrl, deleteAccountUrl, updateAccountUrl } from '@draco/shared-api-client';
import type { AccountUrlType } from '@draco/shared-schemas';
import { useAuth } from '../context/AuthContext';
import { useApiClient } from './useApiClient';
import { unwrapApiResult } from '../utils/apiResult';

export interface AccountUrlCreateResult {
  url: AccountUrlType;
  message: string;
}

export interface AccountUrlUpdateResult {
  url: AccountUrlType;
  message: string;
}

export interface AccountUrlDeleteResult {
  urlId: string;
  message: string;
}

export interface AccountUrlServiceState {
  loading: boolean;
  error: string | null;
}

export function useAccountUrlsService(accountId: string) {
  const { token } = useAuth();
  const apiClient = useApiClient();
  const [state, setState] = useState<AccountUrlServiceState>({ loading: false, error: null });

  const ensurePreconditions = useCallback(() => {
    if (!accountId) {
      throw new Error('Account identifier is required to manage URLs');
    }

    if (!token) {
      throw new Error('Authentication token is required to manage URLs');
    }
  }, [accountId, token]);

  const setLoading = useCallback((loading: boolean) => {
    setState((previous) => ({ ...previous, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((previous) => ({ ...previous, error }));
  }, []);

  const createUrl = useCallback(
    async (url: string): Promise<AccountUrlCreateResult> => {
      setLoading(true);
      setError(null);

      try {
        ensurePreconditions();
        const result = await createAccountUrl({
          client: apiClient,
          path: { accountId },
          body: { url },
          throwOnError: false,
        });

        const createdUrl = unwrapApiResult(result, 'Failed to add URL');

        if (!createdUrl) {
          throw new Error('URL could not be created');
        }

        return {
          url: createdUrl,
          message: 'URL added successfully',
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add URL';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accountId, apiClient, ensurePreconditions, setLoading, setError],
  );

  const updateUrl = useCallback(
    async (urlId: string, url: string): Promise<AccountUrlUpdateResult> => {
      setLoading(true);
      setError(null);

      try {
        ensurePreconditions();
        const result = await updateAccountUrl({
          client: apiClient,
          path: { accountId, urlId },
          body: { url },
          throwOnError: false,
        });

        const updatedUrl = unwrapApiResult(result, 'Failed to update URL');

        if (!updatedUrl) {
          throw new Error('URL could not be updated');
        }

        return {
          url: updatedUrl,
          message: 'URL updated successfully',
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update URL';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accountId, apiClient, ensurePreconditions, setLoading, setError],
  );

  const removeUrl = useCallback(
    async (urlId: string): Promise<AccountUrlDeleteResult> => {
      setLoading(true);
      setError(null);

      try {
        ensurePreconditions();
        await deleteAccountUrl({
          client: apiClient,
          path: { accountId, urlId },
          throwOnError: false,
        });

        return {
          urlId,
          message: 'URL deleted successfully',
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete URL';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accountId, apiClient, ensurePreconditions, setLoading, setError],
  );

  const clearError = useCallback(() => setError(null), [setError]);

  return {
    createUrl,
    updateUrl,
    removeUrl,
    loading: state.loading,
    error: state.error,
    clearError,
  };
}
