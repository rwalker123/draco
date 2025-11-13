'use client';

import { useCallback } from 'react';
import { DiscordLinkStatusType, DiscordOAuthStartResponseType } from '@draco/shared-schemas';
import { useAuth } from '@/context/AuthContext';

type DiscordRequestOptions = RequestInit & { errorMessage?: string };

const buildApiPath = (accountId: string, suffix: string) =>
  `/api/accounts/${accountId}/discord/${suffix}`;

export const useDiscordIntegration = () => {
  const { token } = useAuth();

  const request = useCallback(
    async <T>(path: string, options?: DiscordRequestOptions): Promise<T> => {
      if (!token) {
        throw new Error('You must be signed in to manage Discord integrations.');
      }

      const { errorMessage, ...fetchOptions } = options ?? {};
      const headers = new Headers(fetchOptions.headers);
      headers.set('Authorization', `Bearer ${token}`);

      if (fetchOptions.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      const response = await fetch(path, {
        ...fetchOptions,
        headers,
        cache: 'no-store',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        let message = errorMessage || 'Discord request failed.';
        try {
          const payload = await response.json();
          if (payload && typeof payload.message === 'string') {
            message = payload.message;
          }
        } catch {
          const text = await response.text();
          if (text) {
            message = text;
          }
        }
        throw new Error(message);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return (await response.json()) as T;
    },
    [token],
  );

  const getLinkStatus = useCallback(
    async (accountId: string): Promise<DiscordLinkStatusType> => {
      return request<DiscordLinkStatusType>(buildApiPath(accountId, 'link-status'), {
        method: 'GET',
        errorMessage: 'Unable to load Discord link status.',
      });
    },
    [request],
  );

  const startLink = useCallback(
    async (accountId: string): Promise<DiscordOAuthStartResponseType> => {
      return request<DiscordOAuthStartResponseType>(buildApiPath(accountId, 'link/start'), {
        method: 'POST',
        errorMessage: 'Unable to start the Discord linking flow.',
      });
    },
    [request],
  );

  const unlinkDiscord = useCallback(
    async (accountId: string): Promise<DiscordLinkStatusType> => {
      return request<DiscordLinkStatusType>(buildApiPath(accountId, 'link'), {
        method: 'DELETE',
        errorMessage: 'Unable to unlink the Discord account.',
      });
    },
    [request],
  );

  return {
    getLinkStatus,
    startLink,
    unlinkDiscord,
  };
};
