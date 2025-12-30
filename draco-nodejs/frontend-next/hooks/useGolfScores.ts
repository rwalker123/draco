'use client';

import { useCallback } from 'react';
import {
  getGolfMatchScores,
  getGolfTeamMatchScores,
  getGolfPlayerScores,
  getGolfPlayerSeasonScores,
  getGolfScore,
  submitGolfMatchResults,
  deleteGolfMatchScores,
} from '@draco/shared-api-client';
import type { GolfScoreWithDetailsType, SubmitMatchResultsType } from '@draco/shared-schemas';
import { useApiClient } from './useApiClient';
import { unwrapApiResult } from '../utils/apiResult';

export type GolfScoreServiceResult<T> =
  | { success: true; data: T; message: string }
  | { success: false; error: string };

export interface GolfScoreService {
  getMatchScores: (matchId: string) => Promise<GolfScoreServiceResult<GolfScoreWithDetailsType[]>>;
  getTeamMatchScores: (
    matchId: string,
    teamId: string,
  ) => Promise<GolfScoreServiceResult<GolfScoreWithDetailsType[]>>;
  getPlayerScores: (
    contactId: string,
    limit?: number,
  ) => Promise<GolfScoreServiceResult<GolfScoreWithDetailsType[]>>;
  getPlayerSeasonScores: (
    contactId: string,
    seasonId: string,
  ) => Promise<GolfScoreServiceResult<GolfScoreWithDetailsType[]>>;
  getScore: (scoreId: string) => Promise<GolfScoreServiceResult<GolfScoreWithDetailsType>>;
  submitMatchResults: (
    matchId: string,
    payload: SubmitMatchResultsType,
  ) => Promise<GolfScoreServiceResult<GolfScoreWithDetailsType[]>>;
  deleteMatchScores: (matchId: string) => Promise<GolfScoreServiceResult<void>>;
}

export function useGolfScores(accountId: string): GolfScoreService {
  const apiClient = useApiClient();

  const getMatchScores = useCallback<GolfScoreService['getMatchScores']>(
    async (matchId) => {
      try {
        const result = await getGolfMatchScores({
          client: apiClient,
          path: { accountId, matchId },
          throwOnError: false,
        });

        const scores = unwrapApiResult(result, 'Failed to load match scores');

        return {
          success: true,
          data: scores as GolfScoreWithDetailsType[],
          message: 'Match scores loaded successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load match scores';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const getTeamMatchScores = useCallback<GolfScoreService['getTeamMatchScores']>(
    async (matchId, teamId) => {
      try {
        const result = await getGolfTeamMatchScores({
          client: apiClient,
          path: { accountId, matchId, teamId },
          throwOnError: false,
        });

        const scores = unwrapApiResult(result, 'Failed to load team scores');

        return {
          success: true,
          data: scores as GolfScoreWithDetailsType[],
          message: 'Team scores loaded successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load team scores';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const getPlayerScores = useCallback<GolfScoreService['getPlayerScores']>(
    async (contactId, limit = 20) => {
      try {
        const result = await getGolfPlayerScores({
          client: apiClient,
          path: { accountId, contactId },
          query: { limit },
          throwOnError: false,
        });

        const scores = unwrapApiResult(result, 'Failed to load player scores');

        return {
          success: true,
          data: scores as GolfScoreWithDetailsType[],
          message: 'Player scores loaded successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load player scores';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const getPlayerSeasonScores = useCallback<GolfScoreService['getPlayerSeasonScores']>(
    async (contactId, seasonId) => {
      try {
        const result = await getGolfPlayerSeasonScores({
          client: apiClient,
          path: { accountId, contactId, seasonId },
          throwOnError: false,
        });

        const scores = unwrapApiResult(result, 'Failed to load player season scores');

        return {
          success: true,
          data: scores as GolfScoreWithDetailsType[],
          message: 'Player season scores loaded successfully',
        } as const;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to load player season scores';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const getScore = useCallback<GolfScoreService['getScore']>(
    async (scoreId) => {
      try {
        const result = await getGolfScore({
          client: apiClient,
          path: { accountId, scoreId },
          throwOnError: false,
        });

        const score = unwrapApiResult(result, 'Failed to load score');

        return {
          success: true,
          data: score as GolfScoreWithDetailsType,
          message: 'Score loaded successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load score';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const submitMatchResults = useCallback<GolfScoreService['submitMatchResults']>(
    async (matchId, payload) => {
      try {
        const result = await submitGolfMatchResults({
          client: apiClient,
          path: { accountId, matchId },
          body: payload,
          throwOnError: false,
        });

        const scores = unwrapApiResult(
          result,
          'Failed to submit match results',
        ) as GolfScoreWithDetailsType[];

        return {
          success: true,
          data: scores,
          message: 'Match results submitted successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to submit match results';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const deleteMatchScores = useCallback<GolfScoreService['deleteMatchScores']>(
    async (matchId) => {
      try {
        const result = await deleteGolfMatchScores({
          client: apiClient,
          path: { accountId, matchId },
          throwOnError: false,
        });

        unwrapApiResult(result, 'Failed to delete match scores');

        return {
          success: true,
          data: undefined as void,
          message: 'Match scores deleted successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete match scores';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  return {
    getMatchScores,
    getTeamMatchScores,
    getPlayerScores,
    getPlayerSeasonScores,
    getScore,
    submitMatchResults,
    deleteMatchScores,
  };
}
