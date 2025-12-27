'use client';

import { useCallback } from 'react';
import {
  listGolfCourseTees,
  getGolfCourseTee,
  createGolfCourseTee,
  updateGolfCourseTee,
  deleteGolfCourseTee,
  updateGolfCourseTeesPriorities,
} from '@draco/shared-api-client';
import type {
  GolfCourseTeeType,
  CreateGolfCourseTeeType,
  UpdateGolfCourseTeeType,
} from '@draco/shared-schemas';
import { useApiClient } from './useApiClient';
import { unwrapApiResult } from '../utils/apiResult';

export type GolfTeeServiceResult<T> =
  | { success: true; data: T; message: string }
  | { success: false; error: string };

export interface GolfTeeService {
  listTees: (courseId: string) => Promise<GolfTeeServiceResult<GolfCourseTeeType[]>>;
  getTee: (courseId: string, teeId: string) => Promise<GolfTeeServiceResult<GolfCourseTeeType>>;
  createTee: (
    courseId: string,
    payload: CreateGolfCourseTeeType,
  ) => Promise<GolfTeeServiceResult<GolfCourseTeeType>>;
  updateTee: (
    courseId: string,
    teeId: string,
    payload: UpdateGolfCourseTeeType,
  ) => Promise<GolfTeeServiceResult<GolfCourseTeeType>>;
  deleteTee: (courseId: string, teeId: string) => Promise<GolfTeeServiceResult<void>>;
  updatePriorities: (
    courseId: string,
    priorities: Array<{ id: string; priority: number }>,
  ) => Promise<GolfTeeServiceResult<void>>;
}

export function useGolfTees(accountId: string): GolfTeeService {
  const apiClient = useApiClient();

  const listTees = useCallback<GolfTeeService['listTees']>(
    async (courseId) => {
      try {
        const result = await listGolfCourseTees({
          client: apiClient,
          path: { accountId, courseId },
          throwOnError: false,
        });

        const tees = unwrapApiResult(result, 'Failed to load tees');

        return {
          success: true,
          data: tees as GolfCourseTeeType[],
          message: 'Tees loaded successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load tees';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const getTee = useCallback<GolfTeeService['getTee']>(
    async (courseId, teeId) => {
      try {
        const result = await getGolfCourseTee({
          client: apiClient,
          path: { accountId, courseId, teeId },
          throwOnError: false,
        });

        const tee = unwrapApiResult(result, 'Failed to load tee') as GolfCourseTeeType;

        return {
          success: true,
          data: tee,
          message: 'Tee loaded successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load tee';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const createTee = useCallback<GolfTeeService['createTee']>(
    async (courseId, payload) => {
      try {
        const result = await createGolfCourseTee({
          client: apiClient,
          path: { accountId, courseId },
          body: payload,
          throwOnError: false,
        });

        const tee = unwrapApiResult(result, 'Failed to create tee') as GolfCourseTeeType;

        return {
          success: true,
          data: tee,
          message: 'Tee created successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create tee';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const updateTee = useCallback<GolfTeeService['updateTee']>(
    async (courseId, teeId, payload) => {
      try {
        const result = await updateGolfCourseTee({
          client: apiClient,
          path: { accountId, courseId, teeId },
          body: payload,
          throwOnError: false,
        });

        const tee = unwrapApiResult(result, 'Failed to update tee') as GolfCourseTeeType;

        return {
          success: true,
          data: tee,
          message: 'Tee updated successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update tee';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const deleteTee = useCallback<GolfTeeService['deleteTee']>(
    async (courseId, teeId) => {
      try {
        const result = await deleteGolfCourseTee({
          client: apiClient,
          path: { accountId, courseId, teeId },
          throwOnError: false,
        });

        unwrapApiResult(result, 'Failed to delete tee');

        return {
          success: true,
          data: undefined as void,
          message: 'Tee deleted successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete tee';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const updatePriorities = useCallback<GolfTeeService['updatePriorities']>(
    async (courseId, priorities) => {
      try {
        const result = await updateGolfCourseTeesPriorities({
          client: apiClient,
          path: { accountId, courseId },
          body: { priorities },
          throwOnError: false,
        });

        unwrapApiResult(result, 'Failed to update priorities');

        return {
          success: true,
          data: undefined as void,
          message: 'Priorities updated successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update priorities';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  return {
    listTees,
    getTee,
    createTee,
    updateTee,
    deleteTee,
    updatePriorities,
  };
}
