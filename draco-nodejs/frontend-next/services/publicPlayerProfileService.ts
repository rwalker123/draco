import { getAccountPlayerPublicProfile } from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import type { PublicPlayerProfileType } from '@draco/shared-schemas';

import { createApiClient } from '../lib/apiClientFactory';
import { unwrapApiResult } from '../utils/apiResult';

interface ClientOptions {
  client?: Client;
  token?: string | null;
  signal?: AbortSignal;
}

const resolveClient = ({ client, token }: ClientOptions = {}): Client => {
  if (client) {
    return client;
  }

  return createApiClient({ token: token ?? undefined });
};

export async function fetchPublicPlayerProfile(
  accountId: string,
  contactId: string,
  options?: ClientOptions,
): Promise<PublicPlayerProfileType> {
  const client = resolveClient(options);

  const result = await getAccountPlayerPublicProfile({
    client,
    path: { accountId, contactId },
    signal: options?.signal,
    throwOnError: false,
  });

  return unwrapApiResult(result, 'Failed to load player profile');
}
