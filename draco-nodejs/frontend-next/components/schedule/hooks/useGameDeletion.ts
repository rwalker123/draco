import { useCallback, useState } from 'react';
import { deleteGame } from '@draco/shared-api-client';
import { useApiClient } from '../../../hooks/useApiClient';
import { unwrapApiResult } from '../../../utils/apiResult';
import type { Game } from '@/types/schedule';

export interface UseGameDeletionOptions {
  accountId: string;
}

export interface DeleteGameResult {
  message: string;
  gameId: string;
}

interface UseGameDeletionReturn {
  deleteGame: (game: Game) => Promise<DeleteGameResult>;
  loading: boolean;
  error: string | null;
  resetError: () => void;
}

export const useGameDeletion = ({ accountId }: UseGameDeletionOptions): UseGameDeletionReturn => {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteSelectedGame = useCallback(
    async (game: Game): Promise<DeleteGameResult> => {
      setLoading(true);
      setError(null);

      try {
        const result = await deleteGame({
          client: apiClient,
          path: {
            accountId,
            seasonId: game.season.id,
            gameId: game.id,
          },
          throwOnError: false,
        });

        unwrapApiResult(result, 'Failed to delete game');

        return {
          message: 'Game deleted successfully',
          gameId: game.id,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete game';
        setError(message);
        throw err instanceof Error ? err : new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accountId, apiClient],
  );

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    deleteGame: deleteSelectedGame,
    loading,
    error,
    resetError,
  };
};
