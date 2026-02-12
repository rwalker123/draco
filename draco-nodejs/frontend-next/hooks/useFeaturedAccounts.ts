'use client';

import { useState, useEffect } from 'react';
import { getAccountById } from '@draco/shared-api-client';
import { useApiClient } from './useApiClient';
import type { AccountType } from '@draco/shared-schemas';

interface FeaturedAccountsResult {
  accounts: AccountType[];
  loading: boolean;
  error: string | null;
}

export function useFeaturedAccounts(accountIds: string[]): FeaturedAccountsResult {
  const [accounts, setAccounts] = useState<AccountType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiClient = useApiClient();

  const accountIdsKey = accountIds.join(',');

  useEffect(() => {
    const ids = accountIdsKey ? accountIdsKey.split(',') : [];
    if (ids.length === 0) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchAccounts = async () => {
      setLoading(true);
      setError(null);

      try {
        const results = await Promise.all(
          ids.map(async (accountId) => {
            try {
              const result = await getAccountById({
                client: apiClient,
                path: { accountId },
                signal: controller.signal,
                throwOnError: false,
              });

              if (result.data?.account) {
                return result.data.account;
              }
              return null;
            } catch {
              return null;
            }
          }),
        );

        if (!controller.signal.aborted) {
          const validAccounts = results.filter(
            (account): account is AccountType => account !== null,
          );
          setAccounts(validAccounts);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load featured accounts');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchAccounts();

    return () => {
      controller.abort();
    };
  }, [accountIdsKey, apiClient]);

  return { accounts, loading, error };
}
