import { createClient, createConfig } from '@draco/shared-api-client/generated/client';

import { API_BASE_URL } from '../../config/env';

export type CreateApiClientOptions = {
  token?: string;
};

export const createApiClient = ({ token }: CreateApiClientOptions = {}) => {
  const configOverrides: Parameters<typeof createConfig>[0] = {
    baseUrl: API_BASE_URL
  };

  if (token) {
    configOverrides.auth = () => token;
  }

  return createClient(createConfig(configOverrides));
};
