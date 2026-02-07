import { createClient, createConfig } from '@draco/shared-api-client/generated/client';
import { normalizeOrigin } from './url/normalizeOrigin';

type CreateApiClientOptions = {
  token?: string;
  baseUrl?: string;
  transformHostHeader?: boolean;
  frontendBaseUrl?: string;
};

type ApiClient = ReturnType<typeof createClient>;

let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorizedCallback = (callback: (() => void) | null) => {
  onUnauthorizedCallback = callback;
};

type InterceptorRef = { type: 'request' | 'response'; id: number };

let cachedClient: {
  token: string | undefined;
  client: ApiClient;
  interceptorIds: InterceptorRef[];
} | null = null;

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

  if (useCache && cachedClient !== null) {
    cachedClient.interceptorIds.forEach(({ type, id }) => {
      cachedClient!.client.interceptors[type].eject(id);
    });
  }
  const configOverrides: Parameters<typeof createConfig>[0] = {
    baseUrl,
  };

  if (token) {
    configOverrides.auth = () => token;
  }

  const client = createClient(createConfig(configOverrides));
  const interceptorIds: InterceptorRef[] = [];

  const resolvedFrontendBaseUrl =
    normalizeOrigin(frontendBaseUrl) ||
    (typeof window !== 'undefined' ? normalizeOrigin(window.location.origin) : undefined);

  if (resolvedFrontendBaseUrl) {
    const interceptorId = client.interceptors.request.use(async (request) => {
      const headers = request.headers;

      if (!headers.get('x-frontend-base-url')) {
        headers.set('x-frontend-base-url', resolvedFrontendBaseUrl);
      }

      return request;
    });
    interceptorIds.push({ type: 'request', id: interceptorId });
  }

  if (transformHostHeader) {
    const interceptorId = client.interceptors.request.use(async (request) => {
      const headers = request.headers;

      const hostHeader = headers.get('host');
      if (hostHeader) {
        headers.delete('host');
        headers.set('x-forwarded-host', hostHeader);
      }

      return request;
    });
    interceptorIds.push({ type: 'request', id: interceptorId });
  }

  let unauthorizedFired = false;
  const responseInterceptorId = client.interceptors.response.use((response) => {
    if (response.status === 401 && onUnauthorizedCallback && !unauthorizedFired) {
      unauthorizedFired = true;
      onUnauthorizedCallback();
    }
    return response;
  });
  interceptorIds.push({ type: 'response', id: responseInterceptorId });

  if (useCache) {
    cachedClient = { token, client, interceptorIds };
  }

  return client;
};
