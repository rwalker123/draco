import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { AccountBaseUrlResolver } from '../accountBaseUrlResolver.js';
import { dbAccountUrl, IAccountRepository } from '../../../repositories/index.js';

describe('AccountBaseUrlResolver', () => {
  const originalFrontendUrl = process.env.FRONTEND_URL;
  const originalBaseUrl = process.env.BASE_URL;

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
    vi.restoreAllMocks();
  });

  describe('normalizeBaseUrl', () => {
    it('normalizes schemes and removes paths', () => {
      const normalized = AccountBaseUrlResolver.normalizeBaseUrl('http://example.com/path');
      expect(normalized).toBe('http://example.com');
    });

    it('defaults to https when scheme is missing', () => {
      const normalized = AccountBaseUrlResolver.normalizeBaseUrl('example.com');
      expect(normalized).toBe('https://example.com');
    });

    it('returns null for invalid input', () => {
      const normalized = AccountBaseUrlResolver.normalizeBaseUrl('  ');
      expect(normalized).toBeNull();
    });
  });

  describe('resolveAccountBaseUrl', () => {
    let repository: Pick<IAccountRepository, 'findAccountUrls'>;

    beforeEach(() => {
      repository = {
        findAccountUrls: vi.fn(),
      };
    });

    it('prefers provided accountUrls over repository lookup', async () => {
      const resolver = new AccountBaseUrlResolver(repository);
      const providedUrls: dbAccountUrl[] = [{ id: 1n, accountid: 10n, url: 'team1.example.com' }];

      const result = await resolver.resolveAccountBaseUrl(10n, providedUrls);

      expect(result).toBe('https://team1.example.com');
      expect(repository.findAccountUrls).not.toHaveBeenCalled();
    });

    it('uses repository when no urls provided', async () => {
      repository.findAccountUrls = vi
        .fn()
        .mockResolvedValue([{ id: 2n, accountid: 20n, url: 'http://team2.example.com/path' }]);
      const resolver = new AccountBaseUrlResolver(repository);

      const result = await resolver.resolveAccountBaseUrl(20n);

      expect(result).toBe('http://team2.example.com');
      expect(repository.findAccountUrls).toHaveBeenCalledWith(20n);
    });

    it('falls back to env when repository and input are empty', async () => {
      repository.findAccountUrls = vi.fn().mockResolvedValue([]);
      process.env.FRONTEND_URL = 'https://fallback.example.com/app';
      const resolver = new AccountBaseUrlResolver(repository);

      const result = await resolver.resolveAccountBaseUrl(30n);

      expect(result).toBe('https://fallback.example.com');
    });
  });
});
