'use client';

import { useCallback } from 'react';
import {
  type DiscordAccountConfigType,
  type DiscordAccountConfigUpdateType,
  type DiscordOAuthStartResponseType,
  type DiscordRoleMappingListType,
  type DiscordRoleMappingType,
  type DiscordRoleMappingUpdateType,
  type DiscordChannelMappingListType,
  type DiscordChannelMappingType,
  type DiscordChannelMappingCreateType,
  type DiscordGuildChannelType,
} from '@draco/shared-schemas';
import { useAuth } from '@/context/AuthContext';

type RequestOptions = RequestInit & {
  errorMessage?: string;
};

const buildPath = (accountId: string, suffix: string) =>
  `/api/accounts/${accountId}/discord/${suffix}`;

export const useAccountDiscordAdmin = () => {
  const { token } = useAuth();

  const request = useCallback(
    async <T>(accountId: string, suffix: string, options?: RequestOptions): Promise<T> => {
      if (!token) {
        throw new Error('You must be signed in to manage Discord settings.');
      }

      if (!accountId) {
        throw new Error('Account identifier is required to manage Discord settings.');
      }

      const { errorMessage, ...fetchOptions } = options ?? {};

      const headers = new Headers(fetchOptions.headers);
      headers.set('Authorization', `Bearer ${token}`);
      if (fetchOptions.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }

      const response = await fetch(buildPath(accountId, suffix), {
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

  const fetchConfig = useCallback(
    (accountId: string) =>
      request<DiscordAccountConfigType>(accountId, 'config', {
        method: 'GET',
        errorMessage: 'Unable to load Discord configuration.',
      }),
    [request],
  );

  const updateConfig = useCallback(
    (accountId: string, payload: DiscordAccountConfigUpdateType) =>
      request<DiscordAccountConfigType>(accountId, 'config', {
        method: 'PUT',
        body: JSON.stringify(payload),
        errorMessage: 'Unable to update Discord configuration.',
      }),
    [request],
  );

  const disconnectGuild = useCallback(
    (accountId: string) =>
      request<DiscordAccountConfigType>(accountId, 'config', {
        method: 'DELETE',
        errorMessage: 'Unable to remove Discord configuration.',
      }),
    [request],
  );

  const fetchRoleMappings = useCallback(
    (accountId: string) =>
      request<DiscordRoleMappingListType>(accountId, 'role-mappings', {
        method: 'GET',
        errorMessage: 'Unable to load Discord role mappings.',
      }),
    [request],
  );

  const createRoleMapping = useCallback(
    (accountId: string, payload: DiscordRoleMappingUpdateType) =>
      request<DiscordRoleMappingType>(accountId, 'role-mappings', {
        method: 'POST',
        body: JSON.stringify(payload),
        errorMessage: 'Unable to create Discord role mapping.',
      }),
    [request],
  );

  const updateRoleMapping = useCallback(
    (accountId: string, roleMappingId: string, payload: DiscordRoleMappingUpdateType) =>
      request<DiscordRoleMappingType>(accountId, `role-mappings/${roleMappingId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
        errorMessage: 'Unable to update Discord role mapping.',
      }),
    [request],
  );

  const deleteRoleMapping = useCallback(
    (accountId: string, roleMappingId: string) =>
      request<never>(accountId, `role-mappings/${roleMappingId}`, {
        method: 'DELETE',
        errorMessage: 'Unable to delete Discord role mapping.',
      }),
    [request],
  );

  const startInstall = useCallback(
    (accountId: string) => {
      return request<DiscordOAuthStartResponseType>(accountId, 'install/start', {
        method: 'POST',
        errorMessage: 'Unable to start the Discord bot installation flow.',
      });
    },
    [request],
  );

  const fetchAvailableChannels = useCallback(
    (accountId: string) =>
      request<DiscordGuildChannelType[]>(accountId, 'available-channels', {
        method: 'GET',
        errorMessage: 'Unable to load Discord channels.',
      }),
    [request],
  );

  const fetchChannelMappings = useCallback(
    (accountId: string) =>
      request<DiscordChannelMappingListType>(accountId, 'channel-mappings', {
        method: 'GET',
        errorMessage: 'Unable to load channel mappings.',
      }),
    [request],
  );

  const createChannelMapping = useCallback(
    (accountId: string, payload: DiscordChannelMappingCreateType) =>
      request<DiscordChannelMappingType>(accountId, 'channel-mappings', {
        method: 'POST',
        body: JSON.stringify(payload),
        errorMessage: 'Unable to add the channel mapping.',
      }),
    [request],
  );

  const deleteChannelMapping = useCallback(
    (accountId: string, mappingId: string) =>
      request<never>(accountId, `channel-mappings/${mappingId}`, {
        method: 'DELETE',
        errorMessage: 'Unable to delete the channel mapping.',
      }),
    [request],
  );

  return {
    fetchConfig,
    updateConfig,
    disconnectGuild,
    fetchRoleMappings,
    createRoleMapping,
    updateRoleMapping,
    deleteRoleMapping,
    startInstall,
    fetchAvailableChannels,
    fetchChannelMappings,
    createChannelMapping,
    deleteChannelMapping,
  };
};
