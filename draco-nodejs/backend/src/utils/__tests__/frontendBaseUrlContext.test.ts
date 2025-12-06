import { describe, it, expect } from 'vitest';
import {
  getFrontendBaseUrlFromContext,
  runWithFrontendBaseUrl,
} from '../frontendBaseUrlContext.js';

describe('frontendBaseUrlContext', () => {
  it('returns null when no context is set', () => {
    expect(getFrontendBaseUrlFromContext()).toBeNull();
  });

  it('stores and retrieves the base URL within the same context', () => {
    const result = runWithFrontendBaseUrl('https://example.com', () => {
      return getFrontendBaseUrlFromContext();
    });

    expect(result).toBe('https://example.com');
  });

  it('preserves the base URL across async boundaries', async () => {
    const captured = await runWithFrontendBaseUrl('https://tenant.example.com', async () => {
      const beforeAwait = getFrontendBaseUrlFromContext();
      const afterAwait = await Promise.resolve(getFrontendBaseUrlFromContext());

      return { beforeAwait, afterAwait };
    });

    expect(captured.beforeAwait).toBe('https://tenant.example.com');
    expect(captured.afterAwait).toBe('https://tenant.example.com');
  });
});
