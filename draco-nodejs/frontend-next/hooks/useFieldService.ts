'use client';

import { useCallback } from 'react';
import {
  listAccountFields,
  createAccountField,
  updateAccountField,
  deleteAccountField,
} from '@draco/shared-api-client';
import type { FieldType, FieldsType, UpsertFieldType } from '@draco/shared-schemas';
import { useApiClient } from './useApiClient';
import { unwrapApiResult } from '../utils/apiResult';

export type FieldServiceResult<T> =
  | { success: true; data: T; message: string }
  | { success: false; error: string };

export interface ListFieldParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface FieldService {
  listFields: (params: ListFieldParams) => Promise<FieldServiceResult<FieldsType>>;
  createField: (payload: UpsertFieldType) => Promise<FieldServiceResult<FieldType>>;
  updateField: (
    fieldId: string,
    payload: UpsertFieldType,
  ) => Promise<FieldServiceResult<FieldType>>;
  deleteField: (fieldId: string) => Promise<FieldServiceResult<FieldType>>;
}

const sanitizePayload = (payload: UpsertFieldType): UpsertFieldType => {
  const normalize = (value: string | null | undefined) => {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  };

  const normalizeCoordinate = (value: string | null | undefined) => {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return null;
    }

    const numeric = Number.parseFloat(trimmed);

    if (Number.isNaN(numeric)) {
      return null;
    }

    return numeric.toString();
  };

  return {
    ...payload,
    name: payload.name.trim(),
    shortName: payload.shortName.trim(),
    address: normalize(payload.address),
    city: normalize(payload.city),
    state: normalize(payload.state),
    zip: normalize(payload.zip),
    comment: normalize(payload.comment),
    directions: normalize(payload.directions),
    rainoutNumber: normalize(payload.rainoutNumber),
    latitude: normalizeCoordinate(payload.latitude),
    longitude: normalizeCoordinate(payload.longitude),
  };
};

export function useFieldService(accountId: string): FieldService {
  const apiClient = useApiClient();

  const listFields = useCallback<FieldService['listFields']>(
    async (params: ListFieldParams = {}) => {
      const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc', search } = params;
      const trimmedSearch = search?.trim() || undefined;
      try {
        const result = await listAccountFields({
          client: apiClient,
          path: { accountId },
          throwOnError: false,
          query: {
            page,
            limit,
            skip: (page - 1) * limit,
            sortBy,
            sortOrder,
            search: trimmedSearch,
          },
        });

        const fields = unwrapApiResult(result, 'Failed to load fields');

        return {
          success: true,
          data: fields as FieldsType,
          message: 'Fields loaded successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load fields';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const createField = useCallback<FieldService['createField']>(
    async (payload) => {
      try {
        const sanitizedPayload = sanitizePayload(payload);
        const result = await createAccountField({
          client: apiClient,
          path: { accountId },
          body: sanitizedPayload,
          throwOnError: false,
        });

        const field = unwrapApiResult(result, 'Failed to create field') as FieldType;

        return {
          success: true,
          data: field,
          message: 'Field created successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create field';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const updateField = useCallback<FieldService['updateField']>(
    async (fieldId, payload) => {
      try {
        const sanitizedPayload = sanitizePayload(payload);
        const result = await updateAccountField({
          client: apiClient,
          path: { accountId, fieldId },
          body: sanitizedPayload,
          throwOnError: false,
        });

        const field = unwrapApiResult(result, 'Failed to update field') as FieldType;

        return {
          success: true,
          data: field,
          message: 'Field updated successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update field';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const deleteField = useCallback<FieldService['deleteField']>(
    async (fieldId) => {
      try {
        const result = await deleteAccountField({
          client: apiClient,
          path: { accountId, fieldId },
          throwOnError: false,
        });

        const field = unwrapApiResult(result, 'Failed to delete field') as FieldType;

        return {
          success: true,
          data: field,
          message: 'Field deleted successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete field';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  return {
    listFields,
    createField,
    updateField,
    deleteField,
  };
}
