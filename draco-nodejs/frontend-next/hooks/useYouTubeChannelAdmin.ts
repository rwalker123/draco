'use client';

import { useCallback, useState } from 'react';
import { updateAccount, updateTeamSeason } from '@draco/shared-api-client';
import type { AccountType, TeamSeasonType } from '@draco/shared-schemas';
import { useApiClient } from './useApiClient';
import { unwrapApiResult } from '../utils/apiResult';

interface AccountContextOptions {
  context: 'account';
  accountId: string;
}

interface TeamContextOptions {
  context: 'team';
  accountId: string;
  seasonId: string;
  teamSeasonId: string;
}

export type YouTubeChannelAdminOptions = AccountContextOptions | TeamContextOptions;

export type YouTubeChannelAdminResult =
  | { context: 'account'; account: AccountType }
  | { context: 'team'; teamSeason: TeamSeasonType };

export interface YouTubeChannelAdminHook {
  saveChannel: (channelId: string | null) => Promise<YouTubeChannelAdminResult>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useYouTubeChannelAdmin(
  options: YouTubeChannelAdminOptions,
): YouTubeChannelAdminHook {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const saveChannel = useCallback<YouTubeChannelAdminHook['saveChannel']>(
    async (channelId) => {
      setLoading(true);
      setError(null);

      try {
        if (options.context === 'account') {
          const result = await updateAccount({
            client: apiClient,
            path: { accountId: options.accountId },
            body: { socials: { youtubeUserId: channelId } },
            throwOnError: false,
          });

          const account = unwrapApiResult(
            result,
            'Failed to update YouTube channel',
          ) as AccountType;
          return { context: 'account' as const, account };
        }

        if (!options.seasonId || !options.teamSeasonId) {
          throw new Error('Team season context is required to update the YouTube channel.');
        }

        const result = await updateTeamSeason({
          client: apiClient,
          path: {
            accountId: options.accountId,
            seasonId: options.seasonId,
            teamSeasonId: options.teamSeasonId,
          },
          body: { team: { youtubeUserId: channelId } },
          throwOnError: false,
        });

        const teamSeason = unwrapApiResult(
          result,
          'Failed to update team YouTube channel',
        ) as TeamSeasonType;

        return { context: 'team' as const, teamSeason };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to save the YouTube channel.';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [apiClient, options],
  );

  return { saveChannel, loading, error, clearError };
}
