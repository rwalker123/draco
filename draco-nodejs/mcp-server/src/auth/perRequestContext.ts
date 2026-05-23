import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  userId: string;
  accessToken: string;
  scopes: string[];
  requestId: string;
  cache: Map<string, unknown>;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getContext(): RequestContext {
  const ctx = requestContext.getStore();
  if (!ctx) {
    throw new Error('No request context — tool called outside an authenticated request');
  }
  return ctx;
}
