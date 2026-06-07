import { getAccountUserTeams } from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import type { TeamSeasonType } from '@draco/shared-schemas';
import { unwrapApiResult } from '../utils/apiResult';

interface CacheEntry {
  teams: TeamSeasonType[];
  token: string | null;
}

const teamsCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<TeamSeasonType[]>>();

const normalizeToken = (token: string | null | undefined): string | null => token ?? null;

export const clearUserTeamsCache = (accountId?: string): void => {
  if (accountId) {
    teamsCache.delete(accountId);
    inflight.delete(accountId);
    return;
  }
  teamsCache.clear();
  inflight.clear();
};

export const getUserTeamsCached = async (
  accountId: string,
  token: string | null | undefined,
  apiClient: Client,
): Promise<TeamSeasonType[]> => {
  const normalizedToken = normalizeToken(token);
  const cached = teamsCache.get(accountId);
  if (cached && cached.token === normalizedToken) {
    return cached.teams;
  }

  const existing = inflight.get(accountId);
  if (existing) {
    return existing;
  }

  const request = (async () => {
    const result = await getAccountUserTeams({
      client: apiClient,
      path: { accountId },
      throwOnError: false,
    });
    const payload = unwrapApiResult(result, 'Failed to load team memberships');
    const teams = Array.isArray(payload) ? (payload as TeamSeasonType[]) : [];
    teamsCache.set(accountId, { teams, token: normalizedToken });
    return teams;
  })();

  inflight.set(accountId, request);

  try {
    return await request;
  } finally {
    inflight.delete(accountId);
  }
};
