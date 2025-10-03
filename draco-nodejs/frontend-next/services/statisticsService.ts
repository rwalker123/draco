import {
  getLeaderCategories,
  listBattingStatistics,
  listPitchingStatistics,
  listStatisticalLeaders,
} from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import type {
  LeaderCategoriesType,
  LeaderRowType,
  PlayerBattingStatsType,
  PlayerPitchingStatsType,
} from '@draco/shared-schemas';

import { createApiClient } from '../lib/apiClientFactory';
import { unwrapApiResult } from '../utils/apiResult';

interface ClientOptions {
  client?: Client;
  token?: string | null;
}

const resolveClient = ({ client, token }: ClientOptions = {}): Client => {
  if (client) {
    return client;
  }

  return createApiClient({ token: token ?? undefined });
};

const toStringIfDefined = (value?: number): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return String(value);
};

const sanitizeId = (value?: string): string | undefined => {
  if (!value || value === '0') {
    return undefined;
  }

  return value;
};

export async function fetchLeaderCategories(
  accountId: string,
  options?: ClientOptions,
): Promise<LeaderCategoriesType> {
  const client = resolveClient(options);
  const result = await getLeaderCategories({
    client,
    path: { accountId },
    throwOnError: false,
  });

  return unwrapApiResult(result, 'Failed to load leader categories');
}

export interface BattingStatisticsQueryOptions {
  divisionId?: string;
  teamId?: string;
  isHistorical?: boolean;
  includeAllGameTypes?: boolean;
  page?: number;
  pageSize?: number;
  minAB?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function fetchBattingStatistics(
  accountId: string,
  leagueId: string,
  queryOptions: BattingStatisticsQueryOptions = {},
  options?: ClientOptions,
): Promise<PlayerBattingStatsType[]> {
  const client = resolveClient(options);
  const {
    divisionId,
    teamId,
    isHistorical,
    includeAllGameTypes,
    page,
    pageSize,
    minAB,
    sortField,
    sortOrder,
  } = queryOptions;

  const result = await listBattingStatistics({
    client,
    path: { accountId, leagueId },
    query: {
      divisionId: sanitizeId(divisionId),
      teamId: sanitizeId(teamId),
      isHistorical,
      includeAllGameTypes,
      page: toStringIfDefined(page),
      pageSize: toStringIfDefined(pageSize),
      minAB: toStringIfDefined(minAB),
      sortField,
      sortOrder,
    },
    throwOnError: false,
  });

  return unwrapApiResult(result, 'Failed to load batting statistics');
}

export interface PitchingStatisticsQueryOptions {
  divisionId?: string;
  teamId?: string;
  isHistorical?: boolean;
  includeAllGameTypes?: boolean;
  page?: number;
  pageSize?: number;
  minIP?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function fetchPitchingStatistics(
  accountId: string,
  leagueId: string,
  queryOptions: PitchingStatisticsQueryOptions = {},
  options?: ClientOptions,
): Promise<PlayerPitchingStatsType[]> {
  const client = resolveClient(options);
  const {
    divisionId,
    teamId,
    isHistorical,
    includeAllGameTypes,
    page,
    pageSize,
    minIP,
    sortField,
    sortOrder,
  } = queryOptions;

  const result = await listPitchingStatistics({
    client,
    path: { accountId, leagueId },
    query: {
      divisionId: sanitizeId(divisionId),
      teamId: sanitizeId(teamId),
      isHistorical,
      includeAllGameTypes,
      page: toStringIfDefined(page),
      pageSize: toStringIfDefined(pageSize),
      minIP: toStringIfDefined(minIP),
      sortField,
      sortOrder,
    },
    throwOnError: false,
  });

  return unwrapApiResult(result, 'Failed to load pitching statistics');
}

export interface LeaderQueryOptions {
  divisionId?: string;
  teamId?: string;
  isHistorical?: boolean;
  includeAllGameTypes?: boolean;
  page?: number;
  pageSize?: number;
  minAB?: number;
  minIP?: number;
  limit?: number;
}

export async function fetchStatisticalLeaders(
  accountId: string,
  leagueId: string,
  category: string,
  queryOptions: LeaderQueryOptions = {},
  options?: ClientOptions,
): Promise<LeaderRowType[]> {
  const client = resolveClient(options);
  const {
    divisionId,
    teamId,
    isHistorical,
    includeAllGameTypes,
    page,
    pageSize,
    minAB,
    minIP,
    limit,
  } = queryOptions;

  const result = await listStatisticalLeaders({
    client,
    path: { accountId, leagueId },
    query: {
      category,
      divisionId: sanitizeId(divisionId),
      teamId: sanitizeId(teamId),
      isHistorical,
      includeAllGameTypes,
      page: toStringIfDefined(page),
      pageSize: toStringIfDefined(pageSize),
      minAB: toStringIfDefined(minAB),
      minIP: toStringIfDefined(minIP),
      limit: toStringIfDefined(limit),
    },
    throwOnError: false,
  });

  return unwrapApiResult(result, 'Failed to load statistical leaders');
}
