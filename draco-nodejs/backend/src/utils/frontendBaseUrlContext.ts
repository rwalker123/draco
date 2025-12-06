import { AsyncLocalStorage } from 'node:async_hooks';

const frontendBaseUrlStore = new AsyncLocalStorage<string | null>();

export const getFrontendBaseUrlFromContext = (): string | null => {
  return frontendBaseUrlStore.getStore() ?? null;
};

export const runWithFrontendBaseUrl = (baseUrl: string | null, callback: () => void): void => {
  frontendBaseUrlStore.run(baseUrl, callback);
};
