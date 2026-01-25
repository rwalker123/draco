'use client';

import { useEffect, useState } from 'react';
import { getContactIndividualGolfPlayerScores } from '@draco/shared-api-client';
import type { ContactIndividualGolfAccount } from '@draco/shared-api-client';
import { useApiClient } from './useApiClient';

export interface UseContactIndividualAccountResult {
  data: ContactIndividualGolfAccount | null;
  loading: boolean;
  error: string | null;
}

export function useContactIndividualAccount(contactId: string): UseContactIndividualAccountResult {
  const [data, setData] = useState<ContactIndividualGolfAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiClient = useApiClient();

  useEffect(() => {
    if (!contactId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getContactIndividualGolfPlayerScores({
          client: apiClient,
          path: { contactId },
          throwOnError: false,
        });

        if (cancelled) return;

        if (result.response.ok && result.data !== undefined) {
          setData(result.data);
        } else {
          setError('Failed to load individual account');
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to fetch individual golf account:', err);
        setError(err instanceof Error ? err.message : 'Failed to load individual account');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, [contactId, apiClient]);

  return { data, loading, error };
}
