import { useState, useEffect, useRef } from 'react';
import { useApiClient } from './useApiClient';

import {
  getIndividualLiveSessionStatus,
  getIndividualLiveScoringState,
  startIndividualLiveScoringSession,
  submitIndividualLiveHoleScore,
  advanceIndividualLiveHole,
  finalizeIndividualLiveScoringSession,
  stopIndividualLiveScoringSession,
} from '@draco/shared-api-client';
import type {
  IndividualLiveSessionStatus,
  IndividualLiveScoringState,
  IndividualLiveHoleScore,
  StartIndividualLiveScoring,
  SubmitIndividualLiveHoleScore,
} from '@draco/shared-api-client';
import { unwrapApiResult } from '../utils/apiResult';

export interface UseIndividualLiveScoringOperationsReturn {
  isLoading: boolean;
  error: string | null;
  checkSessionStatus: (accountId: string) => Promise<IndividualLiveSessionStatus | null>;
  getSessionState: (accountId: string) => Promise<IndividualLiveScoringState | null>;
  startSession: (
    accountId: string,
    options: StartIndividualLiveScoring,
  ) => Promise<IndividualLiveScoringState | null>;
  submitScore: (
    accountId: string,
    data: SubmitIndividualLiveHoleScore,
  ) => Promise<IndividualLiveHoleScore | null>;
  advanceHole: (accountId: string, holeNumber: number) => Promise<boolean>;
  finalizeSession: (accountId: string) => Promise<boolean>;
  stopSession: (accountId: string) => Promise<boolean>;
  clearError: () => void;
}

export function useIndividualLiveScoringOperations(): UseIndividualLiveScoringOperationsReturn {
  const apiClient = useApiClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiClientRef = useRef(apiClient);
  useEffect(() => {
    apiClientRef.current = apiClient;
  }, [apiClient]);

  const [ops] = useState(() => ({
    clearError: () => {
      setError(null);
    },

    checkSessionStatus: async (accountId: string): Promise<IndividualLiveSessionStatus | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getIndividualLiveSessionStatus({
          client: apiClientRef.current,
          path: { accountId },
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

    getSessionState: async (accountId: string): Promise<IndividualLiveScoringState | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getIndividualLiveScoringState({
          client: apiClientRef.current,
          path: { accountId },
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
      accountId: string,
      options: StartIndividualLiveScoring,
    ): Promise<IndividualLiveScoringState | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await startIndividualLiveScoringSession({
          client: apiClientRef.current,
          path: { accountId },
          body: options,
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
      accountId: string,
      data: SubmitIndividualLiveHoleScore,
    ): Promise<IndividualLiveHoleScore | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await submitIndividualLiveHoleScore({
          client: apiClientRef.current,
          path: { accountId },
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

    advanceHole: async (accountId: string, holeNumber: number): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        await advanceIndividualLiveHole({
          client: apiClientRef.current,
          path: { accountId },
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

    finalizeSession: async (accountId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        await finalizeIndividualLiveScoringSession({
          client: apiClientRef.current,
          path: { accountId },
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

    stopSession: async (accountId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        await stopIndividualLiveScoringSession({
          client: apiClientRef.current,
          path: { accountId },
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
  }));

  return {
    isLoading,
    error,
    ...ops,
  };
}
