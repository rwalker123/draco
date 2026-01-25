'use client';

import { useState } from 'react';
import { upsertGameRecap } from '@draco/shared-api-client';
import { UpsertGameRecapType } from '@draco/shared-schemas';
import { useApiClient } from './useApiClient';
import { unwrapApiResult } from '../utils/apiResult';

const FAILURE_MESSAGE = 'Failed to save game recap';

export interface UseGameRecapParams {
  accountId: string;
  seasonId: string;
  gameId: string;
  teamSeasonId: string;
}

export type GameRecapMutationResult =
  | { success: true; data: UpsertGameRecapType }
  | { success: false; error: string };

export function useGameRecap({ accountId, seasonId, gameId, teamSeasonId }: UseGameRecapParams) {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);

  const saveRecap = async (payload: UpsertGameRecapType): Promise<GameRecapMutationResult> => {
    setLoading(true);

    try {
      const result = await upsertGameRecap({
        client: apiClient,
        path: { accountId, seasonId, gameId, teamSeasonId },
        body: payload,
        throwOnError: false,
      });

      const savedRecap = unwrapApiResult(result, FAILURE_MESSAGE);
      return { success: true, data: { recap: savedRecap } };
    } catch (error) {
      const message = error instanceof Error ? error.message : FAILURE_MESSAGE;
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { saveRecap, loading };
}
