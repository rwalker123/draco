'use client';

import { useCallback, useMemo } from 'react';
import {
  listGolfLeagueCourses,
  getGolfCourse,
  createGolfCourse,
  updateGolfCourse,
  deleteGolfCourse,
  addGolfLeagueCourse,
  removeGolfLeagueCourse,
  importExternalGolfCourse,
} from '@draco/shared-api-client';
import type {
  GolfCourseWithTeesType,
  GolfLeagueCourseType,
  CreateGolfCourseType,
  UpdateGolfCourseType,
} from '@draco/shared-schemas';
import { useApiClient } from './useApiClient';
import { unwrapApiResult } from '../utils/apiResult';

export type GolfCourseServiceResult<T> =
  | { success: true; data: T; message: string }
  | { success: false; error: string };

export interface GolfCourseService {
  listCourses: () => Promise<GolfCourseServiceResult<GolfLeagueCourseType[]>>;
  getCourse: (courseId: string) => Promise<GolfCourseServiceResult<GolfCourseWithTeesType>>;
  createCourse: (
    payload: CreateGolfCourseType,
  ) => Promise<GolfCourseServiceResult<GolfCourseWithTeesType>>;
  updateCourse: (
    courseId: string,
    payload: UpdateGolfCourseType,
  ) => Promise<GolfCourseServiceResult<GolfCourseWithTeesType>>;
  deleteCourse: (courseId: string) => Promise<GolfCourseServiceResult<void>>;
  addCourseToLeague: (courseId: string) => Promise<GolfCourseServiceResult<GolfLeagueCourseType>>;
  removeCourseFromLeague: (courseId: string) => Promise<GolfCourseServiceResult<void>>;
  importExternalCourse: (
    externalId: string,
  ) => Promise<GolfCourseServiceResult<GolfCourseWithTeesType>>;
}

export function useGolfCourses(accountId: string): GolfCourseService {
  const apiClient = useApiClient();

  const listCourses = useCallback<GolfCourseService['listCourses']>(async () => {
    try {
      const result = await listGolfLeagueCourses({
        client: apiClient,
        path: { accountId },
        throwOnError: false,
      });

      const courses = unwrapApiResult(result, 'Failed to load courses');

      return {
        success: true,
        data: courses as GolfLeagueCourseType[],
        message: 'Courses loaded successfully',
      } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load courses';
      return { success: false, error: message } as const;
    }
  }, [accountId, apiClient]);

  const getCourse = useCallback<GolfCourseService['getCourse']>(
    async (courseId) => {
      try {
        const result = await getGolfCourse({
          client: apiClient,
          path: { accountId, courseId },
          throwOnError: false,
        });

        const course = unwrapApiResult(result, 'Failed to load course') as GolfCourseWithTeesType;

        return {
          success: true,
          data: course,
          message: 'Course loaded successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load course';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const createCourse = useCallback<GolfCourseService['createCourse']>(
    async (payload) => {
      try {
        const result = await createGolfCourse({
          client: apiClient,
          path: { accountId },
          body: payload,
          throwOnError: false,
        });

        const course = unwrapApiResult(result, 'Failed to create course') as GolfCourseWithTeesType;

        return {
          success: true,
          data: course,
          message: 'Course created successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create course';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const updateCourse = useCallback<GolfCourseService['updateCourse']>(
    async (courseId, payload) => {
      try {
        const result = await updateGolfCourse({
          client: apiClient,
          path: { accountId, courseId },
          body: payload,
          throwOnError: false,
        });

        const course = unwrapApiResult(result, 'Failed to update course') as GolfCourseWithTeesType;

        return {
          success: true,
          data: course,
          message: 'Course updated successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update course';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const deleteCourse = useCallback<GolfCourseService['deleteCourse']>(
    async (courseId) => {
      try {
        const result = await deleteGolfCourse({
          client: apiClient,
          path: { accountId, courseId },
          throwOnError: false,
        });

        unwrapApiResult(result, 'Failed to delete course');

        return {
          success: true,
          data: undefined as void,
          message: 'Course deleted successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete course';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const addCourseToLeague = useCallback<GolfCourseService['addCourseToLeague']>(
    async (courseId) => {
      try {
        const result = await addGolfLeagueCourse({
          client: apiClient,
          path: { accountId },
          body: { courseId },
          throwOnError: false,
        });

        const course = unwrapApiResult(
          result,
          'Failed to add course to league',
        ) as GolfLeagueCourseType;

        return {
          success: true,
          data: course,
          message: 'Course added to league successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add course to league';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const removeCourseFromLeague = useCallback<GolfCourseService['removeCourseFromLeague']>(
    async (courseId) => {
      try {
        const result = await removeGolfLeagueCourse({
          client: apiClient,
          path: { accountId, courseId },
          throwOnError: false,
        });

        unwrapApiResult(result, 'Failed to remove course from league');

        return {
          success: true,
          data: undefined as void,
          message: 'Course removed from league successfully',
        } as const;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to remove course from league';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  const importExternalCourse = useCallback<GolfCourseService['importExternalCourse']>(
    async (externalId) => {
      try {
        const result = await importExternalGolfCourse({
          client: apiClient,
          path: { accountId },
          body: { externalId },
          throwOnError: false,
        });

        const course = unwrapApiResult(
          result,
          'Failed to import external course',
        ) as GolfCourseWithTeesType;

        return {
          success: true,
          data: course,
          message: 'Course imported successfully',
        } as const;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to import external course';
        return { success: false, error: message } as const;
      }
    },
    [accountId, apiClient],
  );

  return useMemo(
    () => ({
      listCourses,
      getCourse,
      createCourse,
      updateCourse,
      deleteCourse,
      addCourseToLeague,
      removeCourseFromLeague,
      importExternalCourse,
    }),
    [
      listCourses,
      getCourse,
      createCourse,
      updateCourse,
      deleteCourse,
      addCourseToLeague,
      removeCourseFromLeague,
      importExternalCourse,
    ],
  );
}
