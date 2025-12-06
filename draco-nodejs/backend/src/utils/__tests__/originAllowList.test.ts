import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OriginAllowList } from '../originAllowList.js';
import { IAccountRepository } from '../../repositories/index.js';

describe('OriginAllowList', () => {
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

  describe('isAllowed', () => {
    let repository: IAccountRepository;

    beforeEach(() => {
      process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
      repository = {
        findAccountByUrls: vi.fn(),
      } as unknown as IAccountRepository;
    });

    it('allows requests without an origin (non-browser requests)', async () => {
      const allowList = new OriginAllowList(repository);
      await expect(allowList.isAllowed(undefined)).resolves.toBe(true);
    });

    it('allows the fallback env base URL', async () => {
      process.env.FRONTEND_URL = 'https://app.example.com/';
      const allowList = new OriginAllowList(repository);

      await expect(allowList.isAllowed('https://app.example.com/path')).resolves.toBe(true);
      expect(repository.findAccountByUrls).not.toHaveBeenCalled();
    });

    it('denies invalid origins', async () => {
      const allowList = new OriginAllowList(repository);
      await expect(allowList.isAllowed(':::not-a-url')).resolves.toBe(false);
    });

    it('allows origins that match an account URL (host variants)', async () => {
      const allowList = new OriginAllowList(repository);
      (repository.findAccountByUrls as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 1n,
      });

      await expect(allowList.isAllowed('http://team1.local')).resolves.toBe(true);
      expect(repository.findAccountByUrls).toHaveBeenCalledWith(['team1.local', 'www.team1.local']);
    });

    it('denies origins that do not match any account URL', async () => {
      const allowList = new OriginAllowList(repository);
      (repository.findAccountByUrls as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(allowList.isAllowed('http://unknown.local')).resolves.toBe(false);
    });
  });
});
