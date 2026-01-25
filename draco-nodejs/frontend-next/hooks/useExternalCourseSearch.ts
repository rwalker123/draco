'use client';

import { useState } from 'react';
import { searchExternalCourses, getExternalCourseDetails } from '@draco/shared-api-client';
import type {
  ExternalCourseSearchResultType,
  ExternalCourseDetailType,
} from '@draco/shared-schemas';
import { useApiClient } from './useApiClient';
import { unwrapApiResult } from '../utils/apiResult';

export type ExternalCourseSearchResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface ExternalCourseSearchParams {
  query: string;
  excludeLeague?: boolean;
}

export interface ExternalCourseSearchService {
  search: (
    params: ExternalCourseSearchParams,
  ) => Promise<ExternalCourseSearchResult<ExternalCourseSearchResultType[]>>;
  getDetails: (externalId: string) => Promise<ExternalCourseSearchResult<ExternalCourseDetailType>>;
  loading: boolean;
}

export function useExternalCourseSearch(accountId: string): ExternalCourseSearchService {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(false);

  const search: ExternalCourseSearchService['search'] = async (params) => {
    setLoading(true);
    try {
      const result = await searchExternalCourses({
        client: apiClient,
        path: { accountId },
        query: {
          query: params.query,
          excludeLeague: params.excludeLeague ? 'true' : undefined,
        },
        throwOnError: false,
      });

      const courses = unwrapApiResult(result, 'Failed to search courses');

      return {
        success: true,
        data: courses as ExternalCourseSearchResultType[],
      } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Search failed';
      return { success: false, error: message } as const;
    } finally {
      setLoading(false);
    }
  };

  const getDetails: ExternalCourseSearchService['getDetails'] = async (externalId) => {
    setLoading(true);
    try {
      const result = await getExternalCourseDetails({
        client: apiClient,
        path: { accountId, externalId },
        throwOnError: false,
      });

      const course = unwrapApiResult(result, 'Failed to get course details');

      return {
        success: true,
        data: course as ExternalCourseDetailType,
      } as const;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get details';
      return { success: false, error: message } as const;
    } finally {
      setLoading(false);
    }
  };

  return { search, getDetails, loading };
}
