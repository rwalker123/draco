import type { Client } from '@draco/shared-api-client/generated/client';
import type {
  GolfCourseSlimType,
  GolfCourseWithTeesType,
  CreateGolfCourseType,
  UpdateGolfCourseType,
  PaginationWithTotalType,
} from '@draco/shared-schemas';
import { unwrapApiResult, assertNoApiError } from '../utils/apiResult';

export interface AdminGolfCoursesListResponse {
  courses: GolfCourseSlimType[];
  pagination: PaginationWithTotalType;
}

export interface AdminGolfCourseCountResponse {
  count: number;
}

export interface FetchAdminGolfCoursesOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export const fetchAdminGolfCourses = async (
  client: Client,
  options: FetchAdminGolfCoursesOptions = {},
): Promise<AdminGolfCoursesListResponse> => {
  const { page = 1, limit = 20, search } = options;

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) {
    queryParams.set('search', search);
  }

  const result = await client.get({
    url: `/api/admin/golf/courses?${queryParams.toString()}`,
    security: [{ scheme: 'bearer', type: 'http' }],
  });

  return unwrapApiResult(result, 'Failed to fetch golf courses') as AdminGolfCoursesListResponse;
};

export const fetchAdminGolfCourseCount = async (client: Client): Promise<number> => {
  const result = await client.get({
    url: '/api/admin/golf/courses/count',
    security: [{ scheme: 'bearer', type: 'http' }],
  });

  const data = unwrapApiResult(
    result,
    'Failed to fetch golf course count',
  ) as AdminGolfCourseCountResponse;
  return data.count;
};

export const fetchAdminGolfCourse = async (
  client: Client,
  courseId: string,
): Promise<GolfCourseWithTeesType> => {
  const result = await client.get({
    url: `/api/admin/golf/courses/${courseId}`,
    security: [{ scheme: 'bearer', type: 'http' }],
  });

  return unwrapApiResult(result, 'Failed to fetch golf course') as GolfCourseWithTeesType;
};

export const createAdminGolfCourse = async (
  client: Client,
  courseData: CreateGolfCourseType,
): Promise<GolfCourseWithTeesType> => {
  const result = await client.post({
    url: '/api/admin/golf/courses',
    body: courseData,
    security: [{ scheme: 'bearer', type: 'http' }],
    headers: { 'Content-Type': 'application/json' },
  });

  return unwrapApiResult(result, 'Failed to create golf course') as GolfCourseWithTeesType;
};

export const updateAdminGolfCourse = async (
  client: Client,
  courseId: string,
  courseData: UpdateGolfCourseType,
): Promise<GolfCourseWithTeesType> => {
  const result = await client.put({
    url: `/api/admin/golf/courses/${courseId}`,
    body: courseData,
    security: [{ scheme: 'bearer', type: 'http' }],
    headers: { 'Content-Type': 'application/json' },
  });

  return unwrapApiResult(result, 'Failed to update golf course') as GolfCourseWithTeesType;
};

export const deleteAdminGolfCourse = async (client: Client, courseId: string): Promise<void> => {
  const result = await client.delete({
    url: `/api/admin/golf/courses/${courseId}`,
    security: [{ scheme: 'bearer', type: 'http' }],
  });

  assertNoApiError(result, 'Failed to delete golf course');
};
