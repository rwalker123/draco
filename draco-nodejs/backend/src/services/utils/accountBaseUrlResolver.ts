import { RepositoryFactory, IAccountRepository, dbAccountUrl } from '../../repositories/index.js';

type AccountUrlRepository = Pick<IAccountRepository, 'findAccountUrls'>;

export class AccountBaseUrlResolver {
  private readonly accountRepository: AccountUrlRepository;

  constructor(accountRepository: AccountUrlRepository = RepositoryFactory.getAccountRepository()) {
    this.accountRepository = accountRepository;
  }

  static normalizeBaseUrl(url: string | null | undefined): string | null {
    if (!url) {
      return null;
    }

    const trimmed = url.trim();
    if (!trimmed || trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'null') {
      return null;
    }

    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

    try {
      const parsed = new URL(withScheme);
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      return null;
    }
  }

  static getEnvFallbackBaseUrl(): string {
    const candidates = [process.env.FRONTEND_URL];

    for (const candidate of candidates) {
      const normalized = AccountBaseUrlResolver.normalizeBaseUrl(candidate);
      if (normalized) {
        return normalized;
      }
    }

    return '';
  }

  async resolveAccountBaseUrl(accountId: bigint, accountUrls?: dbAccountUrl[]): Promise<string> {
    const normalizedFromInput = this.getFirstNormalizedUrl(accountUrls);
    if (normalizedFromInput) {
      return normalizedFromInput;
    }

    const urls = await this.accountRepository.findAccountUrls(accountId);
    const normalizedFromDb = this.getFirstNormalizedUrl(urls);
    if (normalizedFromDb) {
      return normalizedFromDb;
    }

    return AccountBaseUrlResolver.getEnvFallbackBaseUrl();
  }

  private getFirstNormalizedUrl(accountUrls?: dbAccountUrl[]): string | null {
    if (!accountUrls?.length) {
      return null;
    }

    const firstUrl = accountUrls[0]?.url;
    return AccountBaseUrlResolver.normalizeBaseUrl(firstUrl);
  }
}
