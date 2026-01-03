'use client';

import { useCallback } from 'react';
import {
  createIndividualGolfAccount,
  createAuthenticatedGolfAccount,
  IndividualGolfAccountResponse,
  AuthenticatedGolfAccountResponse,
} from '@draco/shared-api-client';
import { useApiClient } from './useApiClient';
import { unwrapApiResult } from '../utils/apiResult';

const ERROR_MESSAGE = 'Failed to create golf account. Please try again.';

export interface CreateIndividualGolfAccountInput {
  name: string;
  email: string;
  password: string;
  homeCourseId?: string;
  captchaToken?: string | null;
}

export interface CreateAuthenticatedGolfAccountInput {
  name?: string;
  homeCourseId?: string;
}

export type IndividualGolfAccountResult =
  | { success: true; data: IndividualGolfAccountResponse }
  | { success: false; error: string };

export type AuthenticatedGolfAccountResult =
  | { success: true; data: AuthenticatedGolfAccountResponse }
  | { success: false; error: string };

export const useIndividualGolfAccountService = () => {
  const apiClient = useApiClient();

  const create = useCallback(
    async ({
      name,
      email,
      password,
      homeCourseId,
      captchaToken,
    }: CreateIndividualGolfAccountInput): Promise<IndividualGolfAccountResult> => {
      try {
        const result = await createIndividualGolfAccount({
          client: apiClient,
          throwOnError: false,
          headers: captchaToken ? { 'cf-turnstile-token': captchaToken } : undefined,
          body: {
            name: name.trim(),
            email: email.trim(),
            password,
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
      name,
      homeCourseId,
    }: CreateAuthenticatedGolfAccountInput): Promise<AuthenticatedGolfAccountResult> => {
      try {
        const result = await createAuthenticatedGolfAccount({
          client: apiClient,
          throwOnError: false,
          body: {
            name: name?.trim(),
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

  return { create, createAuthenticated } as const;
};
