'use client';

import { useApiClient } from './useApiClient';
import { useCallback } from 'react';
import {
  listSocialFeed,
  listSocialVideos,
  listCommunityMessages,
  listSocialCommunityChannels,
  deleteSocialFeedItem,
  restoreSocialFeedItem,
} from '@draco/shared-api-client';
import type {
  SocialFeedItemType,
  SocialFeedQueryType,
  SocialVideoType,
  SocialVideoQueryType,
  CommunityMessagePreviewType,
  CommunityMessageQueryType,
  CommunityChannelType,
  CommunityChannelQueryType,
} from '@draco/shared-schemas';
import { unwrapApiResult } from '../utils/apiResult';

interface SocialHubServiceConfig {
  accountId?: string;
  seasonId?: string | null;
}

const buildQuery = <T extends Record<string, unknown>>(query?: Partial<T>) => {
  if (!query) {
    return undefined;
  }

  const definedEntries = Object.entries(query).filter(
    ([, value]) => value !== undefined && value !== null && value !== '',
  );

  return definedEntries.length > 0 ? Object.fromEntries(definedEntries) : undefined;
};

export const useSocialHubService = ({ accountId, seasonId }: SocialHubServiceConfig) => {
  const apiClient = useApiClient();

  const ensureContext = useCallback(() => {
    if (!accountId || !seasonId) {
      throw new Error('Account and season are required to load social content.');
    }
    return { accountId, seasonId };
  }, [accountId, seasonId]);

  const fetchFeed = useCallback(
    async (query?: Partial<SocialFeedQueryType>): Promise<SocialFeedItemType[]> => {
      const context = ensureContext();
      const result = await listSocialFeed({
        client: apiClient,
        path: { accountId: context.accountId, seasonId: context.seasonId },
        query: buildQuery(query),
        throwOnError: false,
      });

      const payload = unwrapApiResult(result, 'Failed to load social feed');
      return payload.feed;
    },
    [apiClient, ensureContext],
  );

  const deleteFeedItem = useCallback(
    async (feedItemId: string): Promise<void> => {
      const context = ensureContext();
      const result = await deleteSocialFeedItem({
        client: apiClient,
        path: {
          accountId: context.accountId,
          seasonId: context.seasonId,
          feedItemId,
        },
        throwOnError: false,
      });

      const payload = unwrapApiResult(result, 'Failed to delete social post');
      if (payload !== undefined) {
        // successful delete returns empty body
        return;
      }
    },
    [apiClient, ensureContext],
  );

  const restoreFeedItem = useCallback(
    async (feedItemId: string): Promise<void> => {
      const context = ensureContext();
      const result = await restoreSocialFeedItem({
        client: apiClient,
        path: {
          accountId: context.accountId,
          seasonId: context.seasonId,
          feedItemId,
        },
        throwOnError: false,
      });

      unwrapApiResult(result, 'Failed to restore social post');
    },
    [apiClient, ensureContext],
  );

  const fetchVideos = useCallback(
    async (query?: Partial<SocialVideoQueryType>): Promise<SocialVideoType[]> => {
      const context = ensureContext();
      const result = await listSocialVideos({
        client: apiClient,
        path: { accountId: context.accountId, seasonId: context.seasonId },
        query: buildQuery(query),
        throwOnError: false,
      });

      const payload = unwrapApiResult(result, 'Failed to load social videos');
      return payload.videos;
    },
    [apiClient, ensureContext],
  );

  const fetchCommunityMessages = useCallback(
    async (query?: Partial<CommunityMessageQueryType>): Promise<CommunityMessagePreviewType[]> => {
      const context = ensureContext();
      const result = await listCommunityMessages({
        client: apiClient,
        path: { accountId: context.accountId, seasonId: context.seasonId },
        query: buildQuery(query),
        throwOnError: false,
      });

      const payload = unwrapApiResult(result, 'Failed to load community messages');
      return payload.messages;
    },
    [apiClient, ensureContext],
  );

  const fetchCommunityChannels = useCallback(
    async (query?: Partial<CommunityChannelQueryType>): Promise<CommunityChannelType[]> => {
      const context = ensureContext();
      const queryParams =
        query?.teamSeasonId && `${query.teamSeasonId}`.trim().length > 0
          ? { teamSeasonId: query.teamSeasonId }
          : undefined;
      const result = await listSocialCommunityChannels({
        client: apiClient,
        path: { accountId: context.accountId, seasonId: context.seasonId },
        ...(queryParams ? { query: queryParams } : {}),
        throwOnError: false,
      });

      const payload = unwrapApiResult(result, 'Failed to load community channels');
      return payload.channels;
    },
    [apiClient, ensureContext],
  );

  return {
    fetchFeed,
    fetchVideos,
    fetchCommunityMessages,
    fetchCommunityChannels,
    deleteFeedItem,
    restoreFeedItem,
  };
};
