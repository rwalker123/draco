'use client';

import { useCallback, useEffect, useState } from 'react';
import { getContactIndividualGolfPlayerScores } from '@draco/shared-api-client';
import type { ContactIndividualGolfAccount } from '@draco/shared-api-client';
import { useApiClient } from './useApiClient';

export interface UseContactIndividualAccountResult {
  data: ContactIndividualGolfAccount | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useContactIndividualAccount(contactId: string): UseContactIndividualAccountResult {
  const [data, setData] = useState<ContactIndividualGolfAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiClient = useApiClient();

  const fetchData = useCallback(async () => {
    if (!contactId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getContactIndividualGolfPlayerScores({
        client: apiClient,
        path: { contactId },
        throwOnError: false,
      });

      if (result.response.ok && result.data !== undefined) {
        setData(result.data);
      } else {
        setError('Failed to load individual account');
      }
    } catch (err) {
      console.error('Failed to fetch individual golf account:', err);
      setError(err instanceof Error ? err.message : 'Failed to load individual account');
    } finally {
      setLoading(false);
    }
  }, [contactId, apiClient]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
