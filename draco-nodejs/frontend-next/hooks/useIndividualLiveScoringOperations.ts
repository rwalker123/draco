import { useCallback, useState } from 'react';
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

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const checkSessionStatus = useCallback(
    async (accountId: string): Promise<IndividualLiveSessionStatus | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getIndividualLiveSessionStatus({
          client: apiClient,
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
    [apiClient],
  );

  const getSessionState = useCallback(
    async (accountId: string): Promise<IndividualLiveScoringState | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getIndividualLiveScoringState({
          client: apiClient,
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
    [apiClient],
  );

  const startSession = useCallback(
    async (
      accountId: string,
      options: StartIndividualLiveScoring,
    ): Promise<IndividualLiveScoringState | null> => {
      console.log('[LIVE_OPS] startSession called', { accountId, options });
      setIsLoading(true);
      setError(null);

      try {
        console.log('[LIVE_OPS] Calling startIndividualLiveScoringSession API...');
        const result = await startIndividualLiveScoringSession({
          client: apiClient,
          path: { accountId },
          body: options,
        });
        console.log('[LIVE_OPS] startSession API response', {
          hasData: !!result.data,
          hasError: !!result.error,
          error: result.error,
        });

        const unwrapped = unwrapApiResult(result, 'Failed to start live scoring');
        console.log('[LIVE_OPS] startSession unwrapped result', { unwrapped });
        return unwrapped;
      } catch (err) {
        console.error('[LIVE_OPS] startSession caught error', err);
        const message = err instanceof Error ? err.message : 'Failed to start live scoring';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient],
  );

  const submitScore = useCallback(
    async (
      accountId: string,
      data: SubmitIndividualLiveHoleScore,
    ): Promise<IndividualLiveHoleScore | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await submitIndividualLiveHoleScore({
          client: apiClient,
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
    [apiClient],
  );

  const advanceHoleOp = useCallback(
    async (accountId: string, holeNumber: number): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        await advanceIndividualLiveHole({
          client: apiClient,
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
    [apiClient],
  );

  const finalizeSession = useCallback(
    async (accountId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        await finalizeIndividualLiveScoringSession({
          client: apiClient,
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
    [apiClient],
  );

  const stopSession = useCallback(
    async (accountId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        await stopIndividualLiveScoringSession({
          client: apiClient,
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
    [apiClient],
  );

  return {
    isLoading,
    error,
    checkSessionStatus,
    getSessionState,
    startSession,
    submitScore,
    advanceHole: advanceHoleOp,
    finalizeSession,
    stopSession,
    clearError,
  };
}
