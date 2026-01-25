'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    let cancelled = false;
    const cacheKey = `${CACHE_KEY_PREFIX}_${accountId}`;

    const fetchConfig = async () => {
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

        if (cancelled) return;

        if (result.data) {
          const newConfig = { expirationDays: result.data.expirationDays };
          setConfig(newConfig);

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
        if (cancelled) return;
        console.error('Failed to fetch classifieds config:', err);
        setError('Failed to load configuration');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchConfig();

    return () => {
      cancelled = true;
    };
  }, [accountId, apiClient]);

  return { config, loading, error };
}
