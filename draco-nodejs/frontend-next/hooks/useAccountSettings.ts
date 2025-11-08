'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccountSettingKey, AccountSettingsStateList } from '@draco/shared-schemas';
import {
  getAccountSettings,
  getAccountSettingsPublic,
  updateAccountSetting,
} from '@draco/shared-api-client';
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

export function useAccountSettings(accountId?: string | null) {
  const { token } = useAuth();
  const apiClient = useApiClient();
  const [state, setState] = useState<AccountSettingsState>({
    data: null,
    loading: Boolean(accountId),
    error: null,
    initialized: false,
    updatingKey: null,
  });

  const canRequest = Boolean(accountId && token);
  const hasAccountContext = Boolean(accountId);

  const fetchSettings = useCallback(async (): Promise<void> => {
    if (!hasAccountContext) {
      setState((previous) => ({
        ...previous,
        loading: false,
        initialized: true,
      }));
      return;
    }

    setState((previous) => ({ ...previous, loading: true, error: null }));

    try {
      const path = { accountId: accountId as string };
      const result = canRequest
        ? await getAccountSettings({
            client: apiClient,
            path,
            throwOnError: false,
          })
        : await getAccountSettingsPublic({
            client: apiClient,
            path,
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
  }, [accountId, apiClient, canRequest, hasAccountContext]);

  useEffect(() => {
    const load = async () => {
      try {
        await fetchSettings();
      } catch {
        // errors are handled inside fetchSettings
      }
    };

    void load();
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
