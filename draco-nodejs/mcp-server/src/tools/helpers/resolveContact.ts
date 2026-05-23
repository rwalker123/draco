import { getCurrentUserContact, getContactRoster } from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import { getContext } from '../../auth/perRequestContext.js';

export interface ContactInfo {
  contactId: string;
  rosterId: string | null;
}

const CACHE_KEY_PREFIX = 'contact:';

export async function resolveContact(client: Client, accountId: string): Promise<ContactInfo> {
  const ctx = getContext();
  const cacheKey = `${CACHE_KEY_PREFIX}${accountId}`;
  const cached = ctx.cache.get(cacheKey);
  if (cached) {
    return cached as ContactInfo;
  }

  const { data: contact } = await getCurrentUserContact({
    client,
    path: { accountId },
    throwOnError: true,
  });

  let rosterId: string | null = null;
  try {
    const { data: roster } = await getContactRoster({
      client,
      path: { accountId, contactId: contact.id },
      throwOnError: true,
    });
    rosterId = roster.id;
  } catch (err) {
    if (!isNotFoundError(err)) {
      throw err;
    }
  }

  const result: ContactInfo = { contactId: contact.id, rosterId };
  ctx.cache.set(cacheKey, result);
  return result;
}

function isNotFoundError(err: unknown): boolean {
  if (err && typeof err === 'object') {
    const e = err as { response?: { status?: number }; status?: number };
    return (e.response?.status ?? e.status) === 404;
  }
  return false;
}
