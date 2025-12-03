import { RepositoryFactory, IAccountRepository } from '../repositories/index.js';
import { AccountBaseUrlResolver } from '../services/utils/accountBaseUrlResolver.js';

export class OriginAllowList {
  private readonly accountRepository: IAccountRepository;
  private readonly fallbackBaseUrl: string;

  constructor(
    accountRepository: IAccountRepository = RepositoryFactory.getAccountRepository(),
    fallbackBaseUrl: string = AccountBaseUrlResolver.getEnvFallbackBaseUrl(),
  ) {
    this.accountRepository = accountRepository;
    this.fallbackBaseUrl = fallbackBaseUrl;
  }

  async isAllowed(origin?: string | null): Promise<boolean> {
    if (!origin) {
      return true;
    }

    const normalizedOrigin = AccountBaseUrlResolver.normalizeBaseUrl(origin);
    if (!normalizedOrigin) {
      return false;
    }

    if (normalizedOrigin === this.fallbackBaseUrl) {
      return true;
    }

    let host: string;
    try {
      host = new URL(normalizedOrigin).host.toLowerCase();
    } catch {
      return false;
    }

    const hostVariants = this.buildHostVariants(host);

    try {
      const account = await this.accountRepository.findAccountByUrls(hostVariants);
      return Boolean(account);
    } catch (error) {
      console.error('[cors] Failed to validate origin', { origin, error });
      return false;
    }
  }

  private buildHostVariants(host: string): string[] {
    const hostWithoutWww = host.replace(/^www\./, '');
    return Array.from(new Set([host, hostWithoutWww, `www.${hostWithoutWww}`]));
  }
}
