import { getAccountById } from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import { getContext } from '../../auth/perRequestContext.js';

const CACHE_KEY_PREFIX = 'accountTimezone:';

export async function getAccountTimezone(client: Client, accountId: string): Promise<string> {
  const ctx = getContext();
  const cacheKey = `${CACHE_KEY_PREFIX}${accountId}`;
  const cached = ctx.cache.get(cacheKey);
  if (cached) {
    return cached as string;
  }

  const { data } = await getAccountById({
    client,
    path: { accountId },
    throwOnError: true,
  });

  const tz = data.account.configuration?.timeZone ?? null;
  if (!tz) {
    console.warn(
      JSON.stringify({ ts: new Date().toISOString(), event: 'account_tz_missing', accountId }),
    );
  }

  const result = tz ?? 'UTC';
  ctx.cache.set(cacheKey, result);
  return result;
}
