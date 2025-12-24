'use client';

import { useState, useEffect, useMemo } from 'react';
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

  const accountIdsKey = useMemo(() => accountIds.join(','), [accountIds]);

  useEffect(() => {
    const ids = accountIdsKey ? accountIdsKey.split(',') : [];
    if (ids.length === 0) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    let ignore = false;

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

        if (!ignore) {
          const validAccounts = results.filter(
            (account): account is AccountType => account !== null,
          );
          setAccounts(validAccounts);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Failed to load featured accounts');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchAccounts();

    return () => {
      ignore = true;
    };
  }, [accountIdsKey, apiClient]);

  return { accounts, loading, error };
}
