'use client';

import { useState } from 'react';
import {
  requestPasswordReset as requestPasswordResetOperation,
  verifyPasswordResetToken as verifyPasswordResetTokenOperation,
  resetPasswordWithToken as resetPasswordWithTokenOperation,
} from '@draco/shared-api-client';
import { useApiClient } from './useApiClient';
import { unwrapApiResult } from '../utils/apiResult';

export interface PasswordResetRequestResult {
  success: boolean;
  message: string;
}

export interface PasswordResetVerificationResult {
  valid: boolean;
  message: string;
  token?: string;
}

export interface PasswordResetCompletionResult {
  success: boolean;
  message: string;
}

export interface PasswordResetService {
  loading: boolean;
  error: string | null;
  requestReset: (email: string, accountId?: string) => Promise<PasswordResetRequestResult>;
  verifyToken: (token: string) => Promise<PasswordResetVerificationResult>;
  resetPassword: (token: string, newPassword: string) => Promise<PasswordResetCompletionResult>;
  setErrorMessage: (message: string) => void;
  clearError: () => void;
}

const DEFAULT_REQUEST_SUCCESS_MESSAGE =
  'If an account with that email exists, a password reset link has been sent.';
const DEFAULT_TOKEN_SUCCESS_MESSAGE = 'Token verified successfully';
const DEFAULT_RESET_SUCCESS_MESSAGE =
  'Password reset successfully! You can now log in with your new password.';

export function usePasswordResetService(): PasswordResetService {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    setError(null);
  };

  const setErrorMessage = (message: string) => {
    setError(message);
  };

  const requestReset = async (
    email: string,
    accountId?: string,
  ): Promise<PasswordResetRequestResult> => {
    setLoading(true);
    clearError();

    try {
      const requestBody = accountId ? { email, accountId } : { email };
      const result = await requestPasswordResetOperation({
        client: apiClient,
        body: requestBody,
        throwOnError: false,
      });

      const data = unwrapApiResult(result, 'Failed to request password reset. Please try again.');

      if (data === true) {
        return { success: true, message: DEFAULT_REQUEST_SUCCESS_MESSAGE };
      }

      if (typeof data === 'object' && data !== null) {
        if ('success' in data) {
          const { success, message } = data as { success: boolean; message?: string };
          if (!success) {
            const failureMessage = message ?? 'Failed to request password reset.';
            setError(failureMessage);
            return { success: false, message: failureMessage };
          }

          return { success: true, message: message ?? DEFAULT_REQUEST_SUCCESS_MESSAGE };
        }

        if ('message' in data && typeof (data as { message?: unknown }).message === 'string') {
          const { message } = data as { message?: string };
          if (message) {
            return { success: true, message };
          }
        }
      }

      return {
        success: true,
        message: 'Password reset request processed. Check your email for further instructions.',
      };
    } catch (caughtError) {
      console.error('Password reset request failed:', caughtError);
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'An error occurred while requesting a password reset.';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const verifyToken = async (token: string): Promise<PasswordResetVerificationResult> => {
    setLoading(true);
    clearError();

    try {
      const result = await verifyPasswordResetTokenOperation({
        client: apiClient,
        body: { token },
        throwOnError: false,
      });

      const data = unwrapApiResult(
        result,
        'Failed to verify the reset token. Please try again.',
      ) as { valid: boolean; message?: string };

      if (data.valid) {
        return { valid: true, message: DEFAULT_TOKEN_SUCCESS_MESSAGE, token };
      }

      const message = data.message ?? 'Invalid or expired reset token';
      setError(message);
      return { valid: false, message };
    } catch (caughtError) {
      console.error('Password reset token verification failed:', caughtError);
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'An error occurred while verifying the token.';
      setError(message);
      return { valid: false, message };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (
    token: string,
    newPassword: string,
  ): Promise<PasswordResetCompletionResult> => {
    setLoading(true);
    clearError();

    try {
      const result = await resetPasswordWithTokenOperation({
        client: apiClient,
        body: { token, newPassword },
        throwOnError: false,
      });

      const data = unwrapApiResult(result, 'Failed to reset password. Please try again.') as
        | { success?: boolean; message?: string }
        | boolean;

      if (typeof data === 'object' && data !== null) {
        const { success, message } = data as { success?: boolean; message?: string };
        if (success === false) {
          const failureMessage = message ?? 'Failed to reset password. Please try again.';
          setError(failureMessage);
          return { success: false, message: failureMessage };
        }

        if (success) {
          return { success: true, message: message ?? DEFAULT_RESET_SUCCESS_MESSAGE };
        }

        if (message) {
          return { success: true, message };
        }
      }

      if (data === false) {
        const failureMessage = 'Failed to reset password. Please try again.';
        setError(failureMessage);
        return { success: false, message: failureMessage };
      }

      return { success: true, message: DEFAULT_RESET_SUCCESS_MESSAGE };
    } catch (caughtError) {
      console.error('Password reset failed:', caughtError);
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'An error occurred while resetting the password.';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    requestReset,
    verifyToken,
    resetPassword,
    setErrorMessage,
    clearError,
  };
}
