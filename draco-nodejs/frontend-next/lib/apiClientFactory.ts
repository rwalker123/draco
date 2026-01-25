import { createClient, createConfig } from '@draco/shared-api-client/generated/client';
import { normalizeOrigin } from './url/normalizeOrigin';

type CreateApiClientOptions = {
  token?: string;
  baseUrl?: string;
  transformHostHeader?: boolean;
  frontendBaseUrl?: string;
};

type ApiClient = ReturnType<typeof createClient>;

// Single-entry cache: stores the most recent client, automatically evicts on token change
let cachedClient: { token: string | undefined; client: ApiClient } | null = null;

export const createApiClient = ({
  token,
  baseUrl = '',
  transformHostHeader = false,
  frontendBaseUrl,
}: CreateApiClientOptions = {}) => {
  // Only use cache for default options (the common case from useApiClient)
  const useCache = baseUrl === '' && !transformHostHeader && !frontendBaseUrl;

  if (useCache && cachedClient !== null && cachedClient.token === token) {
    return cachedClient.client;
  }
  const configOverrides: Parameters<typeof createConfig>[0] = {
    baseUrl,
  };

  if (token) {
    configOverrides.auth = () => token;
  }

  const client = createClient(createConfig(configOverrides));

  const resolvedFrontendBaseUrl =
    normalizeOrigin(frontendBaseUrl) ||
    (typeof window !== 'undefined' ? normalizeOrigin(window.location.origin) : undefined);

  if (resolvedFrontendBaseUrl) {
    client.interceptors.request.use(async (request) => {
      const headers = request.headers;

      if (!headers.get('x-frontend-base-url')) {
        headers.set('x-frontend-base-url', resolvedFrontendBaseUrl);
      }

      return request;
    });
  }

  if (transformHostHeader) {
    client.interceptors.request.use(async (request) => {
      const headers = request.headers;

      const hostHeader = headers.get('host');
      if (hostHeader) {
        headers.delete('host');
        headers.set('x-forwarded-host', hostHeader);
      }

      return request;
    });
  }

  // Cache the client for reuse (replaces any previous cached client)
  if (useCache) {
    cachedClient = { token, client };
  }

  return client;
};
