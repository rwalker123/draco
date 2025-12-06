import { AsyncLocalStorage } from 'node:async_hooks';

const frontendBaseUrlStore = new AsyncLocalStorage<string | null>();

export const getFrontendBaseUrlFromContext = (): string | null => {
  return frontendBaseUrlStore.getStore() ?? null;
};

export const runWithFrontendBaseUrl = <T>(baseUrl: string | null, callback: () => T): T => {
  return frontendBaseUrlStore.run(baseUrl, callback);
};
