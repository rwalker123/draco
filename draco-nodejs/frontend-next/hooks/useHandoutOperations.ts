'use client';

import { useCallback, useMemo, useState } from 'react';
import { HandoutType } from '@draco/shared-schemas';
import { HandoutInput, HandoutService } from '../services/handoutService';
import { useAuth } from '../context/AuthContext';
import { useApiClient } from './useApiClient';

export type HandoutScope =
  | {
      type: 'account';
      accountId: string;
    }
  | {
      type: 'team';
      accountId: string;
      teamId: string;
    };

export function useHandoutOperations(scope: HandoutScope) {
  const { token } = useAuth();
  const apiClient = useApiClient();
  const service = useMemo(() => new HandoutService(token, apiClient), [token, apiClient]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listHandouts = useCallback(async (): Promise<HandoutType[]> => {
    if (scope.type === 'team') {
      return service.listTeamHandouts({ accountId: scope.accountId, teamId: scope.teamId });
    }

    return service.listAccountHandouts(scope.accountId);
  }, [scope, service]);

  const createHandout = useCallback(
    async (input: HandoutInput): Promise<HandoutType> => {
      setLoading(true);
      setError(null);

      try {
        if (scope.type === 'team') {
          return await service.createTeamHandout(
            { accountId: scope.accountId, teamId: scope.teamId },
            input,
          );
        }

        return await service.createAccountHandout(scope.accountId, input);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create handout';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [scope, service],
  );

  const updateHandout = useCallback(
    async (handoutId: string, input: HandoutInput): Promise<HandoutType> => {
      setLoading(true);
      setError(null);

      try {
        if (scope.type === 'team') {
          return await service.updateTeamHandout(
            { accountId: scope.accountId, teamId: scope.teamId },
            handoutId,
            input,
          );
        }

        return await service.updateAccountHandout(scope.accountId, handoutId, input);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update handout';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [scope, service],
  );

  const deleteHandout = useCallback(
    async (handoutId: string): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        if (scope.type === 'team') {
          await service.deleteTeamHandout(
            { accountId: scope.accountId, teamId: scope.teamId },
            handoutId,
          );
        } else {
          await service.deleteAccountHandout(scope.accountId, handoutId);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete handout';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [scope, service],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    listHandouts,
    createHandout,
    updateHandout,
    deleteHandout,
    loading,
    error,
    clearError,
  };
}
