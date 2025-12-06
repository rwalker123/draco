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
    let protocol: string;
    try {
      const parsed = new URL(normalizedOrigin);
      host = parsed.host.toLowerCase();
      protocol = parsed.protocol;
    } catch {
      return false;
    }

    const hostVariants = this.buildHostVariants(host);
    const baseUrlVariants = hostVariants.map((variant) => `${protocol}//${variant}`);
    const lookupVariants = Array.from(new Set([...baseUrlVariants, ...hostVariants]));

    try {
      const account = await this.accountRepository.findAccountByUrls(lookupVariants);
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
