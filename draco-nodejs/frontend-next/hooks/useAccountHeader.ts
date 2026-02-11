'use client';

import { useEffect, useState } from 'react';
import { useApiClient } from './useApiClient';
import { getAccountHeader as apiGetAccountHeader } from '@draco/shared-api-client';
import { addCacheBuster } from '../utils/addCacheBuster';
import { unwrapApiResult } from '../utils/apiResult';

interface UseAccountHeaderResult {
  accountName: string | null;
  logoUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useAccountHeader = (
  accountId?: string | null,
  preferredLogoUrl?: string | null,
): UseAccountHeaderResult => {
  const apiClient = useApiClient();
  const [accountName, setAccountName] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(preferredLogoUrl ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync local logo with preferred logo changes (if provided directly)
  useEffect(() => {
    if (preferredLogoUrl) {
      setLogoUrl(addCacheBuster(preferredLogoUrl));
    } else {
      setLogoUrl(null);
    }
  }, [preferredLogoUrl]);

  useEffect(() => {
    if (!accountId) {
      setAccountName(null);
      if (preferredLogoUrl) {
        setLogoUrl(addCacheBuster(preferredLogoUrl));
      } else {
        setLogoUrl(null);
      }
      return;
    }

    const controller = new AbortController();

    const fetchHeader = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await apiGetAccountHeader({
          client: apiClient,
          path: { accountId },
          signal: controller.signal,
          throwOnError: false,
        });

        if (controller.signal.aborted) {
          return;
        }

        const { name, accountLogoUrl } = unwrapApiResult(result, 'Failed to fetch account header');
        setAccountName(name ?? null);

        const chosenLogo = preferredLogoUrl ?? accountLogoUrl ?? null;
        setLogoUrl(addCacheBuster(chosenLogo));
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        setAccountName(null);
        if (!preferredLogoUrl) {
          setLogoUrl(null);
        }
        setError(err instanceof Error ? err.message : 'Failed to fetch account header');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchHeader();

    return () => {
      controller.abort();
    };
  }, [accountId, preferredLogoUrl, apiClient]);

  return {
    accountName,
    logoUrl,
    isLoading,
    error,
  };
};
