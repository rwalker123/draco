'use client';

import { useCallback } from 'react';
import {
  createIndividualGolfAccount,
  createAuthenticatedGolfAccount,
  deleteIndividualGolfAccount,
  getAccountGolfer,
  getAccountGolferSummary,
  updateGolferHomeCourse,
  createGolferScore,
  getGolferScores,
  updateGolferScore,
  deleteGolferScore,
  IndividualGolfAccountResponse,
  AuthenticatedGolfAccountResponse,
  Golfer,
  GolferSummary,
  GolfScoreWithDetails,
  CreateGolfScore,
  UpdateGolfScore,
} from '@draco/shared-api-client';
import { useApiClient } from './useApiClient';
import { unwrapApiResult } from '../utils/apiResult';

const ERROR_MESSAGE = 'Failed to create golf account. Please try again.';

export interface CreateIndividualGolfAccountInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  password: string;
  timezone: string;
  homeCourseId?: string;
  captchaToken?: string | null;
}

export interface CreateAuthenticatedGolfAccountInput {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  timezone: string;
  homeCourseId?: string;
}

export type IndividualGolfAccountResult =
  | { success: true; data: IndividualGolfAccountResponse }
  | { success: false; error: string };

export type AuthenticatedGolfAccountResult =
  | { success: true; data: AuthenticatedGolfAccountResponse }
  | { success: false; error: string };

export type DeleteGolfAccountResult =
  | { success: true; message: string }
  | { success: false; error: string };

export type GetGolferResult = { success: true; data: Golfer } | { success: false; error: string };

export type GetGolferSummaryResult =
  | { success: true; data: GolferSummary | null }
  | { success: false; error: string };

export type UpdateHomeCourseResult =
  | { success: true; data: Golfer }
  | { success: false; error: string };

export type CreateScoreResult =
  | { success: true; data: GolfScoreWithDetails }
  | { success: false; error: string };

export type GetScoresResult =
  | { success: true; data: GolfScoreWithDetails[] }
  | { success: false; error: string };

export type UpdateScoreResult =
  | { success: true; data: GolfScoreWithDetails }
  | { success: false; error: string };

export type DeleteScoreResult = { success: true } | { success: false; error: string };

export const useIndividualGolfAccountService = () => {
  const apiClient = useApiClient();

  const create = useCallback(
    async ({
      firstName,
      middleName,
      lastName,
      email,
      password,
      timezone,
      homeCourseId,
      captchaToken,
    }: CreateIndividualGolfAccountInput): Promise<IndividualGolfAccountResult> => {
      try {
        const result = await createIndividualGolfAccount({
          client: apiClient,
          throwOnError: false,
          headers: captchaToken ? { 'cf-turnstile-token': captchaToken } : undefined,
          body: {
            firstName: firstName.trim(),
            middleName: middleName?.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            password,
            timezone,
            homeCourseId,
          },
        });

        const data = unwrapApiResult(result, ERROR_MESSAGE);

        return { success: true, data } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : ERROR_MESSAGE;
        return { success: false, error: message } as const;
      }
    },
    [apiClient],
  );

  const createAuthenticated = useCallback(
    async ({
      firstName,
      middleName,
      lastName,
      timezone,
      homeCourseId,
    }: CreateAuthenticatedGolfAccountInput): Promise<AuthenticatedGolfAccountResult> => {
      try {
        const result = await createAuthenticatedGolfAccount({
          client: apiClient,
          throwOnError: false,
          body: {
            firstName: firstName?.trim(),
            middleName: middleName?.trim(),
            lastName: lastName?.trim(),
            timezone,
            homeCourseId,
          },
        });

        const data = unwrapApiResult(result, ERROR_MESSAGE);

        return { success: true, data } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : ERROR_MESSAGE;
        return { success: false, error: message } as const;
      }
    },
    [apiClient],
  );

  const deleteAccount = useCallback(
    async (accountId: string, deleteUser: boolean = false): Promise<DeleteGolfAccountResult> => {
      try {
        const result = await deleteIndividualGolfAccount({
          client: apiClient,
          throwOnError: false,
          path: { accountId },
          body: { deleteUser },
        });

        const data = unwrapApiResult(result, 'Failed to delete account. Please try again.');

        return { success: true, message: data.message ?? 'Account deleted successfully' } as const;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to delete account. Please try again.';
        return { success: false, error: message } as const;
      }
    },
    [apiClient],
  );

  const getGolfer = useCallback(
    async (accountId: string): Promise<GetGolferResult> => {
      try {
        const result = await getAccountGolfer({
          client: apiClient,
          throwOnError: false,
          path: { accountId },
        });

        const data = unwrapApiResult(result, 'Failed to get golfer profile. Please try again.');

        return { success: true, data } as const;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to get golfer profile. Please try again.';
        return { success: false, error: message } as const;
      }
    },
    [apiClient],
  );

  const getGolferSummary = useCallback(
    async (accountId: string): Promise<GetGolferSummaryResult> => {
      try {
        const result = await getAccountGolferSummary({
          client: apiClient,
          throwOnError: false,
          path: { accountId },
        });

        if (result.error) {
          const message = result.error.message ?? 'Failed to get golfer summary.';
          return { success: false, error: message } as const;
        }

        return { success: true, data: result.data ?? null } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get golfer summary.';
        return { success: false, error: message } as const;
      }
    },
    [apiClient],
  );

  const updateHomeCourse = useCallback(
    async (accountId: string, homeCourseId: string | null): Promise<UpdateHomeCourseResult> => {
      try {
        const result = await updateGolferHomeCourse({
          client: apiClient,
          throwOnError: false,
          path: { accountId },
          body: { homeCourseId },
        });

        const data = unwrapApiResult(result, 'Failed to update home course. Please try again.');

        return { success: true, data } as const;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to update home course. Please try again.';
        return { success: false, error: message } as const;
      }
    },
    [apiClient],
  );

  const createScore = useCallback(
    async (accountId: string, scoreData: CreateGolfScore): Promise<CreateScoreResult> => {
      try {
        const result = await createGolferScore({
          client: apiClient,
          throwOnError: false,
          path: { accountId },
          body: scoreData,
        });

        const data = unwrapApiResult(result, 'Failed to create score. Please try again.');

        return { success: true, data } as const;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to create score. Please try again.';
        return { success: false, error: message } as const;
      }
    },
    [apiClient],
  );

  const getScores = useCallback(
    async (accountId: string, limit?: number): Promise<GetScoresResult> => {
      try {
        const result = await getGolferScores({
          client: apiClient,
          throwOnError: false,
          path: { accountId },
          query: { limit },
        });

        const data = unwrapApiResult(result, 'Failed to get scores. Please try again.');

        return { success: true, data } as const;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to get scores. Please try again.';
        return { success: false, error: message } as const;
      }
    },
    [apiClient],
  );

  const updateScore = useCallback(
    async (
      accountId: string,
      scoreId: string,
      scoreData: UpdateGolfScore,
    ): Promise<UpdateScoreResult> => {
      try {
        const result = await updateGolferScore({
          client: apiClient,
          throwOnError: false,
          path: { accountId, scoreId },
          body: scoreData,
        });

        const data = unwrapApiResult(result, 'Failed to update score. Please try again.');

        return { success: true, data } as const;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to update score. Please try again.';
        return { success: false, error: message } as const;
      }
    },
    [apiClient],
  );

  const deleteScore = useCallback(
    async (accountId: string, scoreId: string): Promise<DeleteScoreResult> => {
      try {
        await deleteGolferScore({
          client: apiClient,
          throwOnError: false,
          path: { accountId, scoreId },
        });

        return { success: true } as const;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to delete score. Please try again.';
        return { success: false, error: message } as const;
      }
    },
    [apiClient],
  );

  return {
    create,
    createAuthenticated,
    deleteAccount,
    getGolfer,
    getGolferSummary,
    updateHomeCourse,
    createScore,
    getScores,
    updateScore,
    deleteScore,
  } as const;
};
