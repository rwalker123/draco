'use client';

import { useState } from 'react';
import { deleteAccountLogo, uploadAccountLogo } from '@draco/shared-api-client';
import { formDataBodySerializer } from '@draco/shared-api-client/generated/client';
import { assertNoApiError } from '../utils/apiResult';
import { useApiClient } from './useApiClient';

export type AccountLogoAction = 'upload' | 'delete';

export interface AccountLogoOperationSuccess {
  success: true;
  action: AccountLogoAction;
  message: string;
  logoUrl: string | null;
}

export interface AccountLogoOperationError {
  success: false;
  action: AccountLogoAction;
  error: string;
}

export type AccountLogoOperationResult = AccountLogoOperationSuccess | AccountLogoOperationError;

const buildMissingAccountResult = (action: AccountLogoAction): AccountLogoOperationError => ({
  success: false,
  action,
  error: 'Account identifier is required for logo operations.',
});

export const useAccountLogoOperations = (accountId: string | null) => {
  const apiClient = useApiClient();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const uploadLogo = async (file: File): Promise<AccountLogoOperationResult> => {
    if (!accountId) {
      const result = buildMissingAccountResult('upload');
      setError(result.error);
      return result;
    }

    setUploading(true);
    setError(null);

    try {
      const apiResult = await uploadAccountLogo({
        client: apiClient,
        path: { accountId },
        body: { logo: file },
        headers: { 'Content-Type': null },
        throwOnError: false,
        ...formDataBodySerializer,
      });

      assertNoApiError(apiResult, 'Failed to upload account logo');

      const logoUrl = typeof apiResult.data === 'string' ? apiResult.data : null;

      return {
        success: true,
        action: 'upload',
        message: 'Account logo updated successfully.',
        logoUrl,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload account logo';
      setError(message);
      return {
        success: false,
        action: 'upload',
        error: message,
      };
    } finally {
      setUploading(false);
    }
  };

  const deleteLogo = async (): Promise<AccountLogoOperationResult> => {
    if (!accountId) {
      const result = buildMissingAccountResult('delete');
      setError(result.error);
      return result;
    }

    setDeleting(true);
    setError(null);

    try {
      const apiResult = await deleteAccountLogo({
        client: apiClient,
        path: { accountId },
        throwOnError: false,
      });

      assertNoApiError(apiResult, 'Failed to delete account logo');

      return {
        success: true,
        action: 'delete',
        message: 'Account logo deleted successfully.',
        logoUrl: null,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete account logo';
      setError(message);
      return {
        success: false,
        action: 'delete',
        error: message,
      };
    } finally {
      setDeleting(false);
    }
  };

  return {
    uploadLogo,
    deleteLogo,
    uploading,
    deleting,
    error,
    clearError,
  };
};

export type AccountLogoOperationsHook = ReturnType<typeof useAccountLogoOperations>;
