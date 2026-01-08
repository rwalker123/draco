import { useCallback, useState } from 'react';
import { useApiClient } from './useApiClient';
import { useAccount } from '../context/AccountContext';
import {
  getLiveSessionStatus,
  getLiveScoringState,
  startLiveScoringSession,
  submitLiveHoleScore,
  advanceLiveHole,
  finalizeLiveScoringSession,
  getActiveLiveScoringSessions,
} from '@draco/shared-api-client';
import type {
  LiveSessionStatus,
  LiveScoringState,
  LiveHoleScore,
  StartLiveScoring,
  SubmitLiveHoleScore,
} from '@draco/shared-api-client';
import { unwrapApiResult } from '../utils/apiResult';

export interface UseLiveScoringOperationsReturn {
  isLoading: boolean;
  error: string | null;
  checkSessionStatus: (matchId: string) => Promise<LiveSessionStatus | null>;
  getSessionState: (matchId: string) => Promise<LiveScoringState | null>;
  startSession: (matchId: string, options?: StartLiveScoring) => Promise<LiveScoringState | null>;
  submitScore: (matchId: string, data: SubmitLiveHoleScore) => Promise<LiveHoleScore | null>;
  advanceHole: (matchId: string, holeNumber: number) => Promise<boolean>;
  finalizeSession: (matchId: string) => Promise<boolean>;
  getActiveSessions: () => Promise<{ matchId: string; sessionId: string }[] | null>;
  clearError: () => void;
}

export function useLiveScoringOperations(): UseLiveScoringOperationsReturn {
  const apiClient = useApiClient();
  const { currentAccount } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const checkSessionStatus = useCallback(
    async (matchId: string): Promise<LiveSessionStatus | null> => {
      if (!currentAccount?.id) {
        setError('No account selected');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await getLiveSessionStatus({
          client: apiClient,
          path: {
            accountId: currentAccount.id,
            matchId,
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
    async (matchId: string): Promise<LiveScoringState | null> => {
      if (!currentAccount?.id) {
        setError('No account selected');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await getLiveScoringState({
          client: apiClient,
          path: {
            accountId: currentAccount.id,
            matchId,
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
    async (matchId: string, options?: StartLiveScoring): Promise<LiveScoringState | null> => {
      if (!currentAccount?.id) {
        setError('No account selected');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await startLiveScoringSession({
          client: apiClient,
          path: {
            accountId: currentAccount.id,
            matchId,
          },
          body: options ?? {},
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
    async (matchId: string, data: SubmitLiveHoleScore): Promise<LiveHoleScore | null> => {
      if (!currentAccount?.id) {
        setError('No account selected');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await submitLiveHoleScore({
          client: apiClient,
          path: {
            accountId: currentAccount.id,
            matchId,
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

  const advanceHoleOp = useCallback(
    async (matchId: string, holeNumber: number): Promise<boolean> => {
      if (!currentAccount?.id) {
        setError('No account selected');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        await advanceLiveHole({
          client: apiClient,
          path: {
            accountId: currentAccount.id,
            matchId,
          },
          body: { holeNumber },
        });

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to advance hole';
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient, currentAccount?.id],
  );

  const finalizeSession = useCallback(
    async (matchId: string): Promise<boolean> => {
      if (!currentAccount?.id) {
        setError('No account selected');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        await finalizeLiveScoringSession({
          client: apiClient,
          path: {
            accountId: currentAccount.id,
            matchId,
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

  const getActiveSessions = useCallback(async (): Promise<
    { matchId: string; sessionId: string }[] | null
  > => {
    if (!currentAccount?.id) {
      setError('No account selected');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getActiveLiveScoringSessions({
        client: apiClient,
        path: {
          accountId: currentAccount.id,
        },
      });

      return unwrapApiResult(result, 'Failed to get active sessions') as {
        matchId: string;
        sessionId: string;
      }[];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get active sessions';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, currentAccount?.id]);

  return {
    isLoading,
    error,
    checkSessionStatus,
    getSessionState,
    startSession,
    submitScore,
    advanceHole: advanceHoleOp,
    finalizeSession,
    getActiveSessions,
    clearError,
  };
}
