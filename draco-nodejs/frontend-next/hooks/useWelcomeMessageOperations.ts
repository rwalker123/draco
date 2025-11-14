'use client';

import { useCallback, useMemo, useState } from 'react';
import { type UpsertWelcomeMessageType, type WelcomeMessageType } from '@draco/shared-schemas';

import { useAuth } from '../context/AuthContext';
import { useApiClient } from './useApiClient';
import { WelcomeMessageService } from '../services/welcomeMessageService';

export type WelcomeMessageScope =
  | {
      type: 'account';
      accountId: string;
    }
  | {
      type: 'team';
      accountId: string;
      teamSeasonId: string;
    };

interface OperationResult {
  listMessages: (overrideScope?: WelcomeMessageScope) => Promise<WelcomeMessageType[]>;
  createMessage: (
    payload: UpsertWelcomeMessageType,
    overrideScope?: WelcomeMessageScope,
  ) => Promise<WelcomeMessageType>;
  updateMessage: (
    messageId: string,
    payload: UpsertWelcomeMessageType,
    overrideScope?: WelcomeMessageScope,
  ) => Promise<WelcomeMessageType>;
  deleteMessage: (messageId: string, overrideScope?: WelcomeMessageScope) => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useWelcomeMessageOperations(scope: WelcomeMessageScope): OperationResult {
  const { token } = useAuth();
  const apiClient = useApiClient();
  const service = useMemo(() => new WelcomeMessageService(token, apiClient), [token, apiClient]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveScope = useCallback(
    (override?: WelcomeMessageScope) => {
      const target = override ?? scope;
      if (target.type === 'team') {
        return {
          type: 'team',
          accountId: target.accountId,
          teamSeasonId: target.teamSeasonId,
        } as const;
      }
      return { type: 'account', accountId: target.accountId } as const;
    },
    [scope],
  );

  const listMessages = useCallback(
    async (overrideScope?: WelcomeMessageScope) => {
      const effectiveScope = resolveScope(overrideScope);
      if (effectiveScope.type === 'team') {
        return service.listTeamMessages(effectiveScope.accountId, {
          teamSeasonId: effectiveScope.teamSeasonId,
        });
      }

      return service.listAccountMessages(effectiveScope.accountId);
    },
    [resolveScope, service],
  );

  const createMessage = useCallback(
    async (payload: UpsertWelcomeMessageType, overrideScope?: WelcomeMessageScope) => {
      setLoading(true);
      setError(null);

      try {
        const effectiveScope = resolveScope(overrideScope);
        if (effectiveScope.type === 'team') {
          return await service.createTeamMessage(effectiveScope.accountId, effectiveScope, payload);
        }

        return await service.createAccountMessage(effectiveScope.accountId, payload);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create information message';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [resolveScope, service],
  );

  const updateMessage = useCallback(
    async (
      messageId: string,
      payload: UpsertWelcomeMessageType,
      overrideScope?: WelcomeMessageScope,
    ) => {
      setLoading(true);
      setError(null);

      try {
        const effectiveScope = resolveScope(overrideScope);
        if (effectiveScope.type === 'team') {
          return await service.updateTeamMessage(
            effectiveScope.accountId,
            effectiveScope,
            messageId,
            payload,
          );
        }

        return await service.updateAccountMessage(effectiveScope.accountId, messageId, payload);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update information message';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [resolveScope, service],
  );

  const deleteMessage = useCallback(
    async (messageId: string, overrideScope?: WelcomeMessageScope) => {
      setLoading(true);
      setError(null);

      try {
        const effectiveScope = resolveScope(overrideScope);
        if (effectiveScope.type === 'team') {
          await service.deleteTeamMessage(effectiveScope.accountId, effectiveScope, messageId);
        } else {
          await service.deleteAccountMessage(effectiveScope.accountId, messageId);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete information message';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [resolveScope, service],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    listMessages,
    createMessage,
    updateMessage,
    deleteMessage,
    loading,
    error,
    clearError,
  };
}
