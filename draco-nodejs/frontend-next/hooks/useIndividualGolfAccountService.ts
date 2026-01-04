'use client';

import { useCallback } from 'react';
import {
  createIndividualGolfAccount,
  createAuthenticatedGolfAccount,
  deleteIndividualGolfAccount,
  IndividualGolfAccountResponse,
  AuthenticatedGolfAccountResponse,
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

  return { create, createAuthenticated, deleteAccount } as const;
};
