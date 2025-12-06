import { AccountBaseUrlResolver } from '../services/utils/accountBaseUrlResolver.js';
import type { dbAccountUrl } from '../repositories/types/index.js';
import { getFrontendBaseUrlFromContext } from './frontendBaseUrlContext.js';

const normalizeBase = (baseUrl: string): string => baseUrl.replace(/\/+$/, '');

export const getFrontendBaseUrlOrFallback = (): string => {
  const contextual = getFrontendBaseUrlFromContext();
  if (contextual) {
    return normalizeBase(contextual);
  }

  const fallback = AccountBaseUrlResolver.getEnvFallbackBaseUrl();
  return normalizeBase(fallback);
};

export const resolveAccountFrontendBaseUrl = async (
  accountId: bigint,
  accountUrls?: dbAccountUrl[],
): Promise<string> => {
  const contextual = getFrontendBaseUrlFromContext();
  if (contextual) {
    return normalizeBase(contextual);
  }

  const resolver = new AccountBaseUrlResolver();
  const resolved = await resolver.resolveAccountBaseUrl(accountId, accountUrls);
  return normalizeBase(resolved ?? AccountBaseUrlResolver.getEnvFallbackBaseUrl());
};
