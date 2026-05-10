import { getCurrentSeason } from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import { getContext } from '../../auth/perRequestContext.js';

const CACHE_KEY_PREFIX = 'currentSeason:';

export async function resolveCurrentSeason(
  client: Client,
  accountId: string,
): Promise<{ seasonId: string; seasonName: string }> {
  const ctx = getContext();
  const cacheKey = `${CACHE_KEY_PREFIX}${accountId}`;
  const cached = ctx.cache.get(cacheKey);
  if (cached) {
    return cached as { seasonId: string; seasonName: string };
  }

  const { data } = await getCurrentSeason({
    client,
    path: { accountId },
    throwOnError: true,
  });

  const result = { seasonId: data.id, seasonName: data.name };
  ctx.cache.set(cacheKey, result);
  return result;
}
