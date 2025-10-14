'use client';

import { useCallback } from 'react';
import { registerUser } from '@draco/shared-api-client';
import { useApiClient } from './useApiClient';
import { unwrapApiResult } from '../utils/apiResult';

const SIGNUP_ERROR_MESSAGE = 'Failed to sign up. Please try again.';

export interface RegisterUserInput {
  email: string;
  password: string;
  captchaToken?: string | null;
}

export type SignupResult = { success: true } | { success: false; error: string };

export const useSignupService = () => {
  const apiClient = useApiClient();

  const register = useCallback(
    async ({ email, password, captchaToken }: RegisterUserInput): Promise<SignupResult> => {
      try {
        const result = await registerUser({
          client: apiClient,
          throwOnError: false,
          headers: captchaToken ? { 'cf-turnstile-token': captchaToken } : undefined,
          body: {
            userName: email.trim(),
            password,
          },
        });

        unwrapApiResult(result, SIGNUP_ERROR_MESSAGE);

        return { success: true } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : SIGNUP_ERROR_MESSAGE;
        return { success: false, error: message } as const;
      }
    },
    [apiClient],
  );

  return { register } as const;
};

