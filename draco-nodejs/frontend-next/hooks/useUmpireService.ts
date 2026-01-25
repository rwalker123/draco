'use client';

import {
  createAccountUmpire,
  deleteAccountUmpire,
  listAccountUmpires,
} from '@draco/shared-api-client';
import type { CreateUmpireType, UmpireType, UmpiresType } from '@draco/shared-schemas';
import { useApiClient } from './useApiClient';
import { unwrapApiResult } from '../utils/apiResult';

export type UmpireServiceResult<T> =
  | { success: true; data: T; message: string }
  | { success: false; error: string };

export interface ListUmpireParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UmpireService {
  listUmpires: (params: ListUmpireParams) => Promise<UmpireServiceResult<UmpiresType>>;
  createUmpire: (payload: CreateUmpireType) => Promise<UmpireServiceResult<UmpireType>>;
  deleteUmpire: (umpireId: string) => Promise<UmpireServiceResult<UmpireType>>;
}

export function useUmpireService(accountId: string): UmpireService {
  const apiClient = useApiClient();

  const listUmpires: UmpireService['listUmpires'] = async (params: ListUmpireParams = {}) => {
    const { page = 1, limit = 10, sortBy = 'contacts.lastname', sortOrder = 'asc' } = params;

    try {
      const result = await listAccountUmpires({
        client: apiClient,
        path: { accountId },
        query: {
          page,
          limit,
          skip: (page - 1) * limit,
          sortBy,
          sortOrder,
        },
        throwOnError: false,
      });

      const umpires = unwrapApiResult(result, 'Failed to load umpires');

      return {
        success: true,
        data: umpires as UmpiresType,
        message: 'Umpires loaded successfully',
      } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load umpires';
      return { success: false, error: message } as const;
    }
  };

  const createUmpire: UmpireService['createUmpire'] = async (payload) => {
    try {
      const result = await createAccountUmpire({
        client: apiClient,
        path: { accountId },
        body: payload,
        throwOnError: false,
      });

      const umpire = unwrapApiResult(result, 'Failed to create umpire') as UmpireType;

      return {
        success: true,
        data: umpire,
        message: 'Umpire created successfully',
      } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create umpire';
      return { success: false, error: message } as const;
    }
  };

  const deleteUmpire: UmpireService['deleteUmpire'] = async (umpireId) => {
    try {
      const result = await deleteAccountUmpire({
        client: apiClient,
        path: { accountId, umpireId },
        throwOnError: false,
      });

      const umpire = unwrapApiResult(result, 'Failed to delete umpire') as UmpireType;

      return {
        success: true,
        data: umpire,
        message: 'Umpire deleted successfully',
      } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete umpire';
      return { success: false, error: message } as const;
    }
  };

  return {
    listUmpires,
    createUmpire,
    deleteUmpire,
  };
}
