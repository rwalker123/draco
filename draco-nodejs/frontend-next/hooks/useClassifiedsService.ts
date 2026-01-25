'use client';

import { useAuth } from '../context/AuthContext';
import { useApiClient } from './useApiClient';
import { useState } from 'react';
import {
  createPlayersWantedClassified,
  deletePlayersWantedClassified,
  listPlayersWantedClassifieds,
  updatePlayersWantedClassified,
  createTeamsWantedClassified,
  updateTeamsWantedClassified,
  deleteTeamsWantedClassified,
  getTeamsWantedContactInfo,
} from '@draco/shared-api-client';
import {
  PlayersWantedClassifiedPagedType,
  PlayersWantedClassifiedType,
  UpsertPlayersWantedClassifiedType,
  TeamsWantedContactInfoType,
  TeamsWantedOwnerClassifiedType,
  UpsertTeamsWantedClassifiedType,
} from '@draco/shared-schemas';
import { unwrapApiResult, assertNoApiError } from '../utils/apiResult';
import type { PlayerClassifiedSearchQueryType } from '@draco/shared-schemas';

interface RunOperationConfig<T> {
  operation: () => Promise<T>;
  defaultError: string;
  successMessage?: string;
}

export interface ClassifiedsOperationResult<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

const buildListQuery = (params?: Partial<PlayerClassifiedSearchQueryType>) => {
  if (!params) {
    return undefined;
  }

  const { page, limit, sortBy, sortOrder, searchQuery } = params;
  const query: Record<string, string | number> = {};

  if (page !== undefined) query.page = page;
  if (limit !== undefined) query.limit = limit;
  if (sortBy) query.sortBy = sortBy;
  if (sortOrder) query.sortOrder = sortOrder;
  if (searchQuery) query.searchQuery = searchQuery;

  return Object.keys(query).length > 0 ? query : undefined;
};

function useRunOperation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runOperation = async <T>({
    operation,
    defaultError,
    successMessage,
  }: RunOperationConfig<T>): Promise<ClassifiedsOperationResult<T>> => {
    try {
      setLoading(true);
      setError(null);

      const data = await operation();

      return {
        success: true,
        data,
        message: successMessage,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : defaultError;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const resetError = () => setError(null);

  return { runOperation, loading, error, resetError };
}

export function usePlayersWantedClassifieds(accountId: string) {
  const { token } = useAuth();
  const apiClient = useApiClient();
  const { runOperation, loading, error, resetError } = useRunOperation();

  const requireAuth = () => {
    if (!token) {
      return 'Authentication required to manage Players Wanted classifieds';
    }
    return null;
  };

  const listPlayersWanted = async (
    params?: Partial<PlayerClassifiedSearchQueryType>,
  ): Promise<ClassifiedsOperationResult<PlayersWantedClassifiedPagedType>> => {
    return runOperation<PlayersWantedClassifiedPagedType>({
      defaultError: 'Failed to load Players Wanted classifieds',
      operation: async () => {
        const result = await listPlayersWantedClassifieds({
          client: apiClient,
          path: { accountId },
          query: buildListQuery(params),
          throwOnError: false,
        });

        return unwrapApiResult(result, 'Failed to load Players Wanted classifieds');
      },
    });
  };

  const createPlayersWanted = async (
    payload: UpsertPlayersWantedClassifiedType,
  ): Promise<ClassifiedsOperationResult<PlayersWantedClassifiedType>> => {
    const authError = requireAuth();
    if (authError) {
      return { success: false, error: authError };
    }

    return runOperation<PlayersWantedClassifiedType>({
      defaultError: 'Failed to create Players Wanted classified',
      successMessage: 'Players Wanted ad created successfully',
      operation: async () => {
        const result = await createPlayersWantedClassified({
          client: apiClient,
          path: { accountId },
          body: payload,
          throwOnError: false,
        });

        return unwrapApiResult(result, 'Failed to create Players Wanted classified');
      },
    });
  };

  const updatePlayersWanted = async (
    classifiedId: string,
    payload: UpsertPlayersWantedClassifiedType,
  ): Promise<ClassifiedsOperationResult<PlayersWantedClassifiedType>> => {
    const authError = requireAuth();
    if (authError) {
      return { success: false, error: authError };
    }

    return runOperation<PlayersWantedClassifiedType>({
      defaultError: 'Failed to update Players Wanted classified',
      successMessage: 'Players Wanted ad updated successfully',
      operation: async () => {
        const result = await updatePlayersWantedClassified({
          client: apiClient,
          path: { accountId, classifiedId },
          body: payload,
          throwOnError: false,
        });

        return unwrapApiResult(result, 'Failed to update Players Wanted classified');
      },
    });
  };

  const deletePlayersWanted = async (
    classifiedId: string,
  ): Promise<ClassifiedsOperationResult<void>> => {
    const authError = requireAuth();
    if (authError) {
      return { success: false, error: authError };
    }

    return runOperation<void>({
      defaultError: 'Failed to delete Players Wanted classified',
      successMessage: 'Players Wanted ad deleted successfully',
      operation: async () => {
        const result = await deletePlayersWantedClassified({
          client: apiClient,
          path: { accountId, classifiedId },
          throwOnError: false,
        });

        assertNoApiError(result, 'Failed to delete Players Wanted classified');
      },
    });
  };

  return {
    loading,
    error,
    resetError,
    listPlayersWanted,
    createPlayersWanted,
    updatePlayersWanted,
    deletePlayersWanted,
  };
}

interface TeamsWantedOperationOptions {
  accessCode?: string;
}

interface CreateTeamsWantedOptions {
  captchaToken?: string | null;
}

export function useTeamsWantedClassifieds(accountId: string) {
  const apiClient = useApiClient();
  const { runOperation, loading, error, resetError } = useRunOperation();

  const createTeamsWanted = async (
    payload: UpsertTeamsWantedClassifiedType,
    options?: CreateTeamsWantedOptions,
  ): Promise<ClassifiedsOperationResult<TeamsWantedOwnerClassifiedType>> => {
    return runOperation<TeamsWantedOwnerClassifiedType>({
      defaultError: 'Failed to create Teams Wanted classified',
      successMessage: 'Teams Wanted ad created successfully',
      operation: async () => {
        const result = await createTeamsWantedClassified({
          client: apiClient,
          path: { accountId },
          body: payload,
          headers: options?.captchaToken
            ? { 'cf-turnstile-token': options.captchaToken }
            : undefined,
          throwOnError: false,
        });

        return unwrapApiResult(result, 'Failed to create Teams Wanted classified');
      },
    });
  };

  const updateTeamsWanted = async (
    classifiedId: string,
    payload: UpsertTeamsWantedClassifiedType,
    options?: TeamsWantedOperationOptions,
  ): Promise<ClassifiedsOperationResult<TeamsWantedOwnerClassifiedType>> => {
    return runOperation<TeamsWantedOwnerClassifiedType>({
      defaultError: 'Failed to update Teams Wanted classified',
      successMessage: 'Teams Wanted ad updated successfully',
      operation: async () => {
        const requestBody: UpsertTeamsWantedClassifiedType = {
          ...payload,
          ...(options?.accessCode ? { accessCode: options.accessCode } : {}),
        };

        const result = await updateTeamsWantedClassified({
          client: apiClient,
          path: { accountId, classifiedId },
          body: requestBody,
          throwOnError: false,
        });

        return unwrapApiResult(result, 'Failed to update Teams Wanted classified');
      },
    });
  };

  const deleteTeamsWanted = async (
    classifiedId: string,
    options?: TeamsWantedOperationOptions,
  ): Promise<ClassifiedsOperationResult<void>> => {
    return runOperation<void>({
      defaultError: 'Failed to delete Teams Wanted classified',
      successMessage: 'Teams Wanted ad deleted successfully',
      operation: async () => {
        const result = await deleteTeamsWantedClassified({
          client: apiClient,
          path: { accountId, classifiedId },
          ...(options?.accessCode ? { body: { accessCode: options.accessCode } } : {}),
          throwOnError: false,
        });

        assertNoApiError(result, 'Failed to delete Teams Wanted classified');
      },
    });
  };

  const getTeamsWantedContactForEdit = async (
    classifiedId: string,
    options?: TeamsWantedOperationOptions,
  ): Promise<ClassifiedsOperationResult<TeamsWantedContactInfoType>> => {
    return runOperation<TeamsWantedContactInfoType>({
      defaultError: 'Failed to fetch Teams Wanted contact information',
      operation: async () => {
        const query = options?.accessCode ? { accessCode: options.accessCode } : undefined;

        const result = await getTeamsWantedContactInfo({
          client: apiClient,
          path: { accountId, classifiedId },
          query,
          throwOnError: false,
        });

        return unwrapApiResult(
          result,
          'Failed to fetch Teams Wanted contact information',
        ) as TeamsWantedContactInfoType;
      },
    });
  };

  return {
    loading,
    error,
    resetError,
    createTeamsWanted,
    updateTeamsWanted,
    deleteTeamsWanted,
    getTeamsWantedContactForEdit,
  };
}
