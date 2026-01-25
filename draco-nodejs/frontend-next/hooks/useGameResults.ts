import { useState } from 'react';
import { updateGameResults } from '@draco/shared-api-client';
import { GameResultType, UpdateGameResultsType } from '@draco/shared-schemas';
import { useApiClient } from './useApiClient';
import { getApiErrorMessage, unwrapApiResult } from '../utils/apiResult';

interface UseGameResultsOptions {
  accountId: string;
  seasonId: string;
}

interface UseGameResultsReturn {
  submitResults: (gameId: string, input: UpdateGameResultsType) => Promise<GameResultType>;
  loading: boolean;
  error: string | null;
  resetError: () => void;
}

/**
 * Service hook responsible for schedule game results operations.
 * Encapsulates API integration and shared loading/error handling for dialogs.
 */
export const useGameResults = ({
  accountId,
  seasonId,
}: UseGameResultsOptions): UseGameResultsReturn => {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitResults = async (gameId: string, input: UpdateGameResultsType) => {
    setLoading(true);
    setError(null);

    try {
      const result = await updateGameResults({
        client: apiClient,
        path: { accountId, seasonId, gameId },
        body: input,
        throwOnError: false,
      });

      return unwrapApiResult(result, 'Failed to save game results');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : getApiErrorMessage(err, 'Failed to save game results');
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const resetError = () => {
    setError(null);
  };

  return {
    submitResults,
    loading,
    error,
    resetError,
  };
};
