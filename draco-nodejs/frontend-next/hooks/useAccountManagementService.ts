'use client';

import {
  getManagedAccounts,
  getAccountTypes,
  getAccountAffiliations,
  createAccount as apiCreateAccount,
  updateAccount as apiUpdateAccount,
  deleteAccount as apiDeleteAccount,
  searchAccounts as apiSearchAccounts,
} from '@draco/shared-api-client';
import type {
  AccountType as SharedAccountType,
  AccountTypeReference,
  AccountAffiliationType,
  CreateAccountType,
} from '@draco/shared-schemas';
import { useApiClient } from './useApiClient';
import { assertNoApiError, unwrapApiResult } from '../utils/apiResult';

export type AccountServiceResult<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

export interface CreateAccountInput {
  payload: CreateAccountType;
  captchaToken?: string | null;
}

export interface UpdateAccountInput {
  accountId: string;
  payload: Partial<CreateAccountType>;
}

export interface DeleteAccountInput {
  accountId: string;
}

export interface SearchAccountsInput {
  query: string;
}

export interface AccountManagementService {
  fetchManagedAccounts: () => Promise<AccountServiceResult<SharedAccountType[]>>;
  fetchAccountTypes: () => Promise<AccountServiceResult<AccountTypeReference[]>>;
  fetchAccountAffiliations: () => Promise<AccountServiceResult<AccountAffiliationType[]>>;
  createAccount: (input: CreateAccountInput) => Promise<AccountServiceResult<SharedAccountType>>;
  updateAccount: (input: UpdateAccountInput) => Promise<AccountServiceResult<SharedAccountType>>;
  deleteAccount: (
    input: DeleteAccountInput,
  ) => Promise<AccountServiceResult<{ accountId: string }>>;
  searchAccounts: (
    input: SearchAccountsInput,
  ) => Promise<AccountServiceResult<SharedAccountType[]>>;
}

export function useAccountManagementService(): AccountManagementService {
  const apiClient = useApiClient();

  const fetchManagedAccounts = async () => {
    try {
      const result = await getManagedAccounts({
        client: apiClient,
        throwOnError: false,
      });

      const accounts = unwrapApiResult(result, 'Failed to load accounts') as
        | SharedAccountType[]
        | undefined;

      return {
        success: true,
        data: accounts ?? [],
        message: 'Accounts loaded successfully',
      } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load accounts';
      return { success: false, error: message } as const;
    }
  };

  const fetchAccountTypes = async () => {
    try {
      const result = await getAccountTypes({
        client: apiClient,
        throwOnError: false,
      });

      const accountTypes = unwrapApiResult(result, 'Failed to load account types') as
        | AccountTypeReference[]
        | undefined;

      return {
        success: true,
        data: accountTypes ?? [],
        message: 'Account types loaded successfully',
      } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load account types';
      return { success: false, error: message } as const;
    }
  };

  const fetchAccountAffiliations = async () => {
    try {
      const result = await getAccountAffiliations({
        client: apiClient,
        throwOnError: false,
      });

      const affiliations = unwrapApiResult(result, 'Failed to load affiliations') as
        | AccountAffiliationType[]
        | undefined;

      return {
        success: true,
        data: affiliations ?? [],
        message: 'Affiliations loaded successfully',
      } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load affiliations';
      return { success: false, error: message } as const;
    }
  };

  const createAccount: AccountManagementService['createAccount'] = async ({
    payload,
    captchaToken,
  }) => {
    try {
      const result = await apiCreateAccount({
        client: apiClient,
        body: payload,
        throwOnError: false,
        headers: captchaToken ? { 'cf-turnstile-token': captchaToken } : undefined,
      });

      const account = unwrapApiResult(result, 'Failed to create account') as SharedAccountType;

      return {
        success: true,
        data: account,
        message: 'Account created successfully',
      } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create account';
      return { success: false, error: message } as const;
    }
  };

  const updateAccount: AccountManagementService['updateAccount'] = async ({
    accountId,
    payload,
  }) => {
    try {
      const result = await apiUpdateAccount({
        client: apiClient,
        path: { accountId },
        body: payload,
        throwOnError: false,
      });

      const updatedAccount = unwrapApiResult(
        result,
        'Failed to update account',
      ) as SharedAccountType;

      return {
        success: true,
        data: updatedAccount,
        message: 'Account updated successfully',
      } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update account';
      return { success: false, error: message } as const;
    }
  };

  const deleteAccount: AccountManagementService['deleteAccount'] = async ({ accountId }) => {
    try {
      const result = await apiDeleteAccount({
        client: apiClient,
        path: { accountId },
        throwOnError: false,
      });

      assertNoApiError(result, 'Failed to delete account');

      return {
        success: true,
        data: { accountId },
        message: 'Account deleted successfully',
      } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete account';
      return { success: false, error: message } as const;
    }
  };

  const searchAccounts: AccountManagementService['searchAccounts'] = async ({ query }) => {
    try {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        return {
          success: true,
          data: [],
          message: 'No query provided',
        } as const;
      }

      const result = await apiSearchAccounts({
        client: apiClient,
        throwOnError: false,
        query: { q: trimmedQuery },
      });

      const accounts = unwrapApiResult(result, 'Failed to search accounts') as
        | SharedAccountType[]
        | undefined;

      return {
        success: true,
        data: accounts ?? [],
        message: 'Accounts loaded successfully',
      } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to search accounts';
      return { success: false, error: message } as const;
    }
  };

  return {
    fetchManagedAccounts,
    fetchAccountTypes,
    fetchAccountAffiliations,
    createAccount,
    updateAccount,
    deleteAccount,
    searchAccounts,
  };
}
