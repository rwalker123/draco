import { getAdminAnalyticsSummary } from '@draco/shared-api-client';
import type { GetAdminAnalyticsSummaryResponse } from '@draco/shared-api-client/generated';
import type { Client } from '@draco/shared-api-client/generated/client';
import { unwrapApiResult } from '../utils/apiResult';

export type AdminAnalyticsSummary = GetAdminAnalyticsSummaryResponse;

export const fetchAdminAnalyticsSummary = async (
  client: Client,
): Promise<AdminAnalyticsSummary> => {
  const result = await getAdminAnalyticsSummary({
    client,
    throwOnError: false,
  });

  const data = unwrapApiResult(result, 'Failed to load administrator analytics');
  return data as AdminAnalyticsSummary;
};
