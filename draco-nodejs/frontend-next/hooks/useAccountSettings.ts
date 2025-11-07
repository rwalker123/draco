'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccountSettingKey, AccountSettingsStateList } from '@draco/shared-schemas';
import { getAccountSettings, updateAccountSetting } from '@draco/shared-api-client';
import { useAuth } from '../context/AuthContext';
import { useApiClient } from './useApiClient';
import { unwrapApiResult } from '../utils/apiResult';

interface AccountSettingsState {
  data: AccountSettingsStateList | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  updatingKey: AccountSettingKey | null;
}

const initialState: AccountSettingsState = {
  data: null,
  loading: false,
  error: null,
  initialized: false,
  updatingKey: null,
};

export function useAccountSettings(accountId?: string | null) {
  const { token } = useAuth();
  const apiClient = useApiClient();
  const [state, setState] = useState<AccountSettingsState>(initialState);

  const canRequest = Boolean(accountId && token);

  const fetchSettings = useCallback(async (): Promise<void> => {
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
      const result = await getAccountSettings({
        client: apiClient,
        path: { accountId: accountId as string },
        throwOnError: false,
      });

      const payload = unwrapApiResult(result, 'Failed to load account settings');

      setState((previous) => ({
        ...previous,
        data: payload ?? [],
        error: null,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load account settings';
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
    let cancelled = false;

    const load = async () => {
      try {
        await fetchSettings();
      } catch {
        // errors are handled inside fetchSettings
      }
    };

    if (!cancelled) {
      load();
    }

    return () => {
      cancelled = true;
    };
  }, [fetchSettings]);

  const updateSetting = useCallback(
    async (settingKey: AccountSettingKey, value: boolean | number): Promise<void> => {
      if (!canRequest) {
        throw new Error('Authentication is required to update account settings.');
      }

      setState((previous) => ({
        ...previous,
        updatingKey: settingKey,
        error: null,
      }));

      try {
        const result = await updateAccountSetting({
          client: apiClient,
          path: { accountId: accountId as string, settingKey },
          body: { value },
          throwOnError: false,
        });

        unwrapApiResult(result, 'Failed to update account setting');
        await fetchSettings();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update account setting';
        setState((previous) => ({
          ...previous,
          error: message,
        }));
        throw new Error(message);
      } finally {
        setState((previous) => ({
          ...previous,
          updatingKey: null,
        }));
      }
    },
    [accountId, apiClient, canRequest, fetchSettings],
  );

  const clearError = useCallback(() => {
    setState((previous) => ({ ...previous, error: null }));
  }, []);

  return useMemo(
    () => ({
      settings: state.data,
      loading: state.loading && !state.initialized,
      refreshing: state.loading && state.initialized,
      error: state.error,
      updatingKey: state.updatingKey,
      updateSetting,
      refetch: fetchSettings,
      clearError,
    }),
    [clearError, fetchSettings, state, updateSetting],
  );
}
