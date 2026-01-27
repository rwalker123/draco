'use client';

import { useState } from 'react';
import { AccountPollType, CreatePollType, UpdatePollType } from '@draco/shared-schemas';
import { createAccountPoll, updateAccountPoll, deleteAccountPoll } from '@draco/shared-api-client';
import { useApiClient } from './useApiClient';
import { unwrapApiResult, assertNoApiError } from '@/utils/apiResult';

export type CreatePollPayload = CreatePollType;

export type UpdatePollPayload = UpdatePollType;

export interface PollMutationResult {
  message: string;
  poll: AccountPollType;
}

export interface PollDeletionResult {
  message: string;
  pollId: string;
}

export function usePollsService(accountId: string) {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPoll = async (payload: CreatePollPayload): Promise<PollMutationResult> => {
    setLoading(true);
    setError(null);

    try {
      const result = await createAccountPoll({
        client: apiClient,
        path: { accountId },
        body: payload,
        throwOnError: false,
      });

      const poll = unwrapApiResult(result, 'Failed to create poll');

      return {
        message: 'Poll created successfully.',
        poll,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create poll.';
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const updatePoll = async (
    pollId: string,
    payload: UpdatePollPayload,
  ): Promise<PollMutationResult> => {
    setLoading(true);
    setError(null);

    try {
      const result = await updateAccountPoll({
        client: apiClient,
        path: { accountId, pollId },
        body: payload,
        throwOnError: false,
      });

      const poll = unwrapApiResult(result, 'Failed to update poll');

      return {
        message: 'Poll updated successfully.',
        poll,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update poll.';
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const deletePoll = async (pollId: string): Promise<PollDeletionResult> => {
    setLoading(true);
    setError(null);

    try {
      const result = await deleteAccountPoll({
        client: apiClient,
        path: { accountId, pollId },
        throwOnError: false,
      });

      assertNoApiError(result, 'Failed to delete poll');

      return {
        message: 'Poll deleted successfully.',
        pollId,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete poll.';
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const resetError = () => setError(null);

  return {
    createPoll,
    updatePoll,
    deletePoll,
    loading,
    error,
    resetError,
  };
}
