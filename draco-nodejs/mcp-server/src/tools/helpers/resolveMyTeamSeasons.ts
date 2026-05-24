import { listMyTeamSeasons } from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import { getContext } from '../../auth/perRequestContext.js';

const CACHE_KEY_PREFIX = 'myTeamSeasons:';

export async function resolveMyTeamSeasons(
  client: Client,
  accountId: string,
  seasonId: string,
): Promise<string[]> {
  const ctx = getContext();
  const cacheKey = `${CACHE_KEY_PREFIX}${accountId}:${seasonId}`;
  const cached = ctx.cache.get(cacheKey);
  if (cached) {
    return cached as string[];
  }

  const { data } = await listMyTeamSeasons({
    client,
    path: { accountId, seasonId },
    throwOnError: true,
  });

  const teamSeasonIds = data.map((t) => t.teamSeasonId);
  ctx.cache.set(cacheKey, teamSeasonIds);
  return teamSeasonIds;
}
