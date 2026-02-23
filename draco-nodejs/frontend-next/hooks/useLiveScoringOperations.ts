import { useState, useEffect, useRef } from 'react';
import { useApiClient } from './useApiClient';
import { useAccount } from '../context/AccountContext';
import {
  getLiveSessionStatus,
  getLiveScoringState,
  startLiveScoringSession,
  submitLiveHoleScore,
  advanceLiveHole,
  finalizeLiveScoringSession,
  stopLiveScoringSession,
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
  stopSession: (matchId: string) => Promise<boolean>;
  getActiveSessions: (
    accountIdOverride?: string,
  ) => Promise<{ matchId: string; sessionId: string }[] | null>;
  clearError: () => void;
}

export function useLiveScoringOperations(): UseLiveScoringOperationsReturn {
  const apiClient = useApiClient();
  const { currentAccount } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiClientRef = useRef(apiClient);
  useEffect(() => {
    apiClientRef.current = apiClient;
  }, [apiClient]);

  const currentAccountRef = useRef(currentAccount);
  useEffect(() => {
    currentAccountRef.current = currentAccount;
  }, [currentAccount]);

  const [ops] = useState(() => ({
    clearError: () => {
      setError(null);
    },

    checkSessionStatus: async (matchId: string): Promise<LiveSessionStatus | null> => {
      if (!currentAccountRef.current?.id) {
        setError('No account selected');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await getLiveSessionStatus({
          client: apiClientRef.current,
          path: {
            accountId: currentAccountRef.current.id,
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

    getSessionState: async (matchId: string): Promise<LiveScoringState | null> => {
      if (!currentAccountRef.current?.id) {
        setError('No account selected');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await getLiveScoringState({
          client: apiClientRef.current,
          path: {
            accountId: currentAccountRef.current.id,
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

    startSession: async (
      matchId: string,
      options?: StartLiveScoring,
    ): Promise<LiveScoringState | null> => {
      if (!currentAccountRef.current?.id) {
        setError('No account selected');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await startLiveScoringSession({
          client: apiClientRef.current,
          path: {
            accountId: currentAccountRef.current.id,
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

    submitScore: async (
      matchId: string,
      data: SubmitLiveHoleScore,
    ): Promise<LiveHoleScore | null> => {
      if (!currentAccountRef.current?.id) {
        setError('No account selected');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await submitLiveHoleScore({
          client: apiClientRef.current,
          path: {
            accountId: currentAccountRef.current.id,
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

    advanceHole: async (matchId: string, holeNumber: number): Promise<boolean> => {
      if (!currentAccountRef.current?.id) {
        setError('No account selected');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        await advanceLiveHole({
          client: apiClientRef.current,
          path: {
            accountId: currentAccountRef.current.id,
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

    finalizeSession: async (matchId: string): Promise<boolean> => {
      if (!currentAccountRef.current?.id) {
        setError('No account selected');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        await finalizeLiveScoringSession({
          client: apiClientRef.current,
          path: {
            accountId: currentAccountRef.current.id,
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

    stopSession: async (matchId: string): Promise<boolean> => {
      if (!currentAccountRef.current?.id) {
        setError('No account selected');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        await stopLiveScoringSession({
          client: apiClientRef.current,
          path: {
            accountId: currentAccountRef.current.id,
            matchId,
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

    getActiveSessions: async (
      accountIdOverride?: string,
    ): Promise<{ matchId: string; sessionId: string }[] | null> => {
      const accountId = accountIdOverride ?? currentAccountRef.current?.id;
      if (!accountId) {
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await getActiveLiveScoringSessions({
          client: apiClientRef.current,
          path: {
            accountId,
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
    },
  }));

  return {
    isLoading,
    error,
    ...ops,
  };
}
