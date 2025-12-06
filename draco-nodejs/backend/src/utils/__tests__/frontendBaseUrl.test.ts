import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import type { dbAccountUrl } from '../../repositories/types/index.js';
import { AccountBaseUrlResolver } from '../../services/utils/accountBaseUrlResolver.js';

vi.mock('../frontendBaseUrlContext.js', () => ({
  getFrontendBaseUrlFromContext: vi.fn(),
}));

import { getFrontendBaseUrlFromContext } from '../frontendBaseUrlContext.js';
import { getFrontendBaseUrlOrFallback, resolveAccountFrontendBaseUrl } from '../frontendBaseUrl.js';

describe('frontendBaseUrl utilities', () => {
  const originalFrontendUrl = process.env.FRONTEND_URL;
  const originalBaseUrl = process.env.BASE_URL;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalFrontendUrl === undefined) {
      delete process.env.FRONTEND_URL;
    } else {
      process.env.FRONTEND_URL = originalFrontendUrl;
    }

    if (originalBaseUrl === undefined) {
      delete process.env.BASE_URL;
    } else {
      process.env.BASE_URL = originalBaseUrl;
    }
  });

  it('returns contextual base URL when set', () => {
    (getFrontendBaseUrlFromContext as unknown as Mock).mockReturnValue(
      'https://tenant.example.com/',
    );

    const result = getFrontendBaseUrlOrFallback();

    expect(result).toBe('https://tenant.example.com');
  });

  it('falls back to env base URL when context is missing', () => {
    (getFrontendBaseUrlFromContext as unknown as Mock).mockReturnValue(null);
    process.env.FRONTEND_URL = 'https://env.example.com/';

    const result = getFrontendBaseUrlOrFallback();

    expect(result).toBe('https://env.example.com');
  });

  it('resolves account base URL via AccountBaseUrlResolver when no context', async () => {
    (getFrontendBaseUrlFromContext as unknown as Mock).mockReturnValue(null);
    const accountUrls: dbAccountUrl[] = [{ id: 1n, url: 'team.example.com' } as dbAccountUrl];
    const resolverSpy = vi
      .spyOn(AccountBaseUrlResolver.prototype, 'resolveAccountBaseUrl')
      .mockResolvedValue('https://team.example.com/');

    const result = await resolveAccountFrontendBaseUrl(1n, accountUrls);

    expect(resolverSpy).toHaveBeenCalledWith(1n, accountUrls);
    expect(result).toBe('https://team.example.com');
  });
});
