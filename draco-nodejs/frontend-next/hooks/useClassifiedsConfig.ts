'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApiClient } from './useApiClient';
import { getPlayerClassifiedsConfig } from '@draco/shared-api-client';

interface ClassifiedsConfig {
  expirationDays: number;
}

const DEFAULT_EXPIRATION_DAYS = 45;
const CACHE_KEY_PREFIX = 'draco_classifieds_config';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedConfig {
  config: ClassifiedsConfig;
  timestamp: number;
}

export function useClassifiedsConfig(accountId: string) {
  const [config, setConfig] = useState<ClassifiedsConfig>({
    expirationDays: DEFAULT_EXPIRATION_DAYS,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiClient = useApiClient();

  const fetchConfig = useCallback(async () => {
    const cacheKey = `${CACHE_KEY_PREFIX}_${accountId}`;

    // Check sessionStorage cache first
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed: CachedConfig = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          setConfig(parsed.config);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Ignore cache read errors
    }

    try {
      setLoading(true);
      const result = await getPlayerClassifiedsConfig({
        client: apiClient,
        path: { accountId },
        throwOnError: false,
      });

      if (result.data) {
        const newConfig = { expirationDays: result.data.expirationDays };
        setConfig(newConfig);

        // Cache the result
        try {
          const cacheEntry: CachedConfig = {
            config: newConfig,
            timestamp: Date.now(),
          };
          sessionStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
        } catch {
          // Ignore cache write errors
        }
      }
    } catch (err) {
      console.error('Failed to fetch classifieds config:', err);
      setError('Failed to load configuration');
      // Keep default value on error
    } finally {
      setLoading(false);
    }
  }, [accountId, apiClient]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return { config, loading, error };
}
