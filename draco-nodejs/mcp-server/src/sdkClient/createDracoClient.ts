import { createClient, createConfig } from '@draco/shared-api-client/generated/client';
import type { Client } from '@draco/shared-api-client/generated/client';
import { env } from '../config/env.js';
import { getContext } from '../auth/perRequestContext.js';

export function getDracoClient(): Client {
  return createClient(
    createConfig({
      baseUrl: env.BACKEND_BASE_URL,
      auth: () => getContext().accessToken,
    }),
  );
}
