import type { Client } from '@draco/shared-api-client/generated/client';
import type {
  GolfCourseTeeType,
  CreateGolfCourseTeeType,
  UpdateGolfCourseTeeType,
} from '@draco/shared-schemas';
import { unwrapApiResult, assertNoApiError } from '../utils/apiResult';

export const createAdminGolfTee = async (
  client: Client,
  courseId: string,
  teeData: CreateGolfCourseTeeType,
): Promise<GolfCourseTeeType> => {
  const result = await client.post({
    url: `/api/admin/golf/courses/${courseId}/tees`,
    body: teeData,
    security: [{ scheme: 'bearer', type: 'http' }],
    headers: { 'Content-Type': 'application/json' },
  });

  return unwrapApiResult(result, 'Failed to create tee') as GolfCourseTeeType;
};

export const updateAdminGolfTee = async (
  client: Client,
  courseId: string,
  teeId: string,
  teeData: UpdateGolfCourseTeeType,
): Promise<GolfCourseTeeType> => {
  const result = await client.put({
    url: `/api/admin/golf/courses/${courseId}/tees/${teeId}`,
    body: teeData,
    security: [{ scheme: 'bearer', type: 'http' }],
    headers: { 'Content-Type': 'application/json' },
  });

  return unwrapApiResult(result, 'Failed to update tee') as GolfCourseTeeType;
};

export const deleteAdminGolfTee = async (
  client: Client,
  courseId: string,
  teeId: string,
): Promise<void> => {
  const result = await client.delete({
    url: `/api/admin/golf/courses/${courseId}/tees/${teeId}`,
    security: [{ scheme: 'bearer', type: 'http' }],
  });

  assertNoApiError(result, 'Failed to delete tee');
};
