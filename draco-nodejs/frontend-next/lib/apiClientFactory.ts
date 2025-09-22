import { createClient, createConfig } from '@draco/shared-api-client/generated/client';

type CreateApiClientOptions = {
  token?: string;
  baseUrl?: string;
  transformHostHeader?: boolean;
};

export const createApiClient = ({
  token,
  baseUrl = '',
  transformHostHeader = false,
}: CreateApiClientOptions = {}) => {
  const configOverrides: Parameters<typeof createConfig>[0] = {
    baseUrl,
  };

  if (token) {
    configOverrides.auth = () => token;
  }

  const client = createClient(createConfig(configOverrides));

  if (transformHostHeader) {
    client.interceptors.request.use(async (options) => {
      let headers = options.headers;

      if (!headers) {
        headers = new Headers();
        options.headers = headers;
      } else if (!(headers instanceof Headers)) {
        headers = new Headers(headers as Record<string, string>);
        options.headers = headers;
      }

      const hostHeader = headers.get('host');
      if (hostHeader) {
        headers.delete('host');
        headers.set('x-forwarded-host', hostHeader);
      }
    });
  }

  return client;
};
