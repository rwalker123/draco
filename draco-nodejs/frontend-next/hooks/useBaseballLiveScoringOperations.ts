import { useCallback, useState } from 'react';
import { useApiClient } from './useApiClient';
import { useAccount } from '../context/AccountContext';
import {
  getBaseballLiveSessionStatus,
  getBaseballLiveScoringState,
  startBaseballLiveScoringSession,
  submitBaseballLiveInningScore,
  advanceBaseballInning,
  finalizeBaseballLiveScoringSession,
  stopBaseballLiveScoringSession,
  getActiveBaseballLiveScoringSessions,
} from '@draco/shared-api-client';
import type {
  BaseballLiveSessionStatus,
  BaseballLiveScoringState,
  BaseballLiveInningScore,
  SubmitBaseballLiveInningScore,
} from '@draco/shared-api-client';
import { unwrapApiResult } from '../utils/apiResult';

export interface UseBaseballLiveScoringOperationsReturn {
  isLoading: boolean;
  error: string | null;
  checkSessionStatus: (gameId: string) => Promise<BaseballLiveSessionStatus | null>;
  getSessionState: (gameId: string) => Promise<BaseballLiveScoringState | null>;
  startSession: (gameId: string) => Promise<BaseballLiveScoringState | null>;
  submitScore: (
    gameId: string,
    data: SubmitBaseballLiveInningScore,
  ) => Promise<BaseballLiveInningScore | null>;
  advanceInning: (gameId: string, inningNumber: number) => Promise<boolean>;
  finalizeSession: (gameId: string) => Promise<boolean>;
  stopSession: (gameId: string) => Promise<boolean>;
  getActiveSessions: (
    accountIdOverride?: string,
  ) => Promise<{ gameId: string; sessionId: string }[] | null>;
  clearError: () => void;
}

export function useBaseballLiveScoringOperations(): UseBaseballLiveScoringOperationsReturn {
  const apiClient = useApiClient();
  const { currentAccount } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const checkSessionStatus = useCallback(
    async (gameId: string): Promise<BaseballLiveSessionStatus | null> => {
      if (!currentAccount?.id) {
        setError('No account selected');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await getBaseballLiveSessionStatus({
          client: apiClient,
          path: {
            accountId: currentAccount.id,
            gameId,
          },
        });

        return unwrapApiResult(result, 'Failed to check session status');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to check session status';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient, currentAccount?.id],
  );

  const getSessionState = useCallback(
    async (gameId: string): Promise<BaseballLiveScoringState | null> => {
      if (!currentAccount?.id) {
        setError('No account selected');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await getBaseballLiveScoringState({
          client: apiClient,
          path: {
            accountId: currentAccount.id,
            gameId,
          },
        });

        return unwrapApiResult(result, 'Failed to get session state');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get session state';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient, currentAccount?.id],
  );

  const startSession = useCallback(
    async (gameId: string): Promise<BaseballLiveScoringState | null> => {
      if (!currentAccount?.id) {
        setError('No account selected');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await startBaseballLiveScoringSession({
          client: apiClient,
          path: {
            accountId: currentAccount.id,
            gameId,
          },
          body: {},
        });

        return unwrapApiResult(result, 'Failed to start live scoring');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to start live scoring';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient, currentAccount?.id],
  );

  const submitScore = useCallback(
    async (
      gameId: string,
      data: SubmitBaseballLiveInningScore,
    ): Promise<BaseballLiveInningScore | null> => {
      if (!currentAccount?.id) {
        setError('No account selected');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await submitBaseballLiveInningScore({
          client: apiClient,
          path: {
            accountId: currentAccount.id,
            gameId,
          },
          body: data,
        });

        return unwrapApiResult(result, 'Failed to submit score');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to submit score';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient, currentAccount?.id],
  );

  const advanceInningOp = useCallback(
    async (gameId: string, inningNumber: number): Promise<boolean> => {
      if (!currentAccount?.id) {
        setError('No account selected');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        await advanceBaseballInning({
          client: apiClient,
          path: {
            accountId: currentAccount.id,
            gameId,
          },
          body: { inningNumber },
        });

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to advance inning';
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient, currentAccount?.id],
  );

  const finalizeSession = useCallback(
    async (gameId: string): Promise<boolean> => {
      if (!currentAccount?.id) {
        setError('No account selected');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        await finalizeBaseballLiveScoringSession({
          client: apiClient,
          path: {
            accountId: currentAccount.id,
            gameId,
          },
          body: { confirm: true },
        });

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to finalize session';
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient, currentAccount?.id],
  );

  const stopSession = useCallback(
    async (gameId: string): Promise<boolean> => {
      if (!currentAccount?.id) {
        setError('No account selected');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        await stopBaseballLiveScoringSession({
          client: apiClient,
          path: {
            accountId: currentAccount.id,
            gameId,
          },
          body: { confirm: true },
        });

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to stop session';
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient, currentAccount?.id],
  );

  const getActiveSessions = useCallback(
    async (accountIdOverride?: string): Promise<{ gameId: string; sessionId: string }[] | null> => {
      const accountId = accountIdOverride ?? currentAccount?.id;
      if (!accountId) {
        // Don't set error - this is expected for unauthenticated users without override
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await getActiveBaseballLiveScoringSessions({
          client: apiClient,
          path: {
            accountId,
          },
        });

        return unwrapApiResult(result, 'Failed to get active sessions') as {
          gameId: string;
          sessionId: string;
        }[];
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get active sessions';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient, currentAccount?.id],
  );

  return {
    isLoading,
    error,
    checkSessionStatus,
    getSessionState,
    startSession,
    submitScore,
    advanceInning: advanceInningOp,
    finalizeSession,
    stopSession,
    getActiveSessions,
    clearError,
  };
}
