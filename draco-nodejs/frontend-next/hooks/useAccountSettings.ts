'use client';

import { useEffect, useState } from 'react';
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

interface UseAccountSettingsOptions {
  requireManage?: boolean;
}

export function useAccountSettings(accountId?: string | null, options?: UseAccountSettingsOptions) {
  const { token } = useAuth();
  const apiClient = useApiClient();
  const requireManage = options?.requireManage ?? false;
  const [state, setState] = useState<AccountSettingsState>({
    data: null,
    loading: Boolean(accountId),
    error: null,
    initialized: false,
    updatingKey: null,
  });

  const canRequest = requireManage && Boolean(accountId && token);
  const hasAccountContext = Boolean(accountId);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!hasAccountContext) {
      setState((previous) => ({
        ...previous,
        loading: false,
        initialized: true,
      }));
      return;
    }

    let cancelled = false;

    const fetchSettings = async (): Promise<void> => {
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

        if (cancelled) return;

        const payload = unwrapApiResult(result, 'Failed to load account settings');

        setState((previous) => ({
          ...previous,
          data: payload ?? [],
          error: null,
        }));
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Failed to load account settings';
        setState((previous) => ({
          ...previous,
          error: message,
        }));
      } finally {
        if (!cancelled) {
          setState((previous) => ({
            ...previous,
            loading: false,
            initialized: true,
          }));
        }
      }
    };

    void fetchSettings();

    return () => {
      cancelled = true;
    };
  }, [accountId, canRequest, hasAccountContext, apiClient, refreshKey]);

  const updateSetting = async (
    settingKey: AccountSettingKey,
    value: boolean | number,
  ): Promise<void> => {
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
      setRefreshKey((prev) => prev + 1);
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
  };

  const clearError = () => {
    setState((previous) => ({ ...previous, error: null }));
  };

  return {
    settings: state.data,
    loading: state.loading && !state.initialized,
    refreshing: state.loading && state.initialized,
    error: state.error,
    updatingKey: state.updatingKey,
    updateSetting,
    refetch: () => setRefreshKey((prev) => prev + 1),
    clearError,
  };
}
