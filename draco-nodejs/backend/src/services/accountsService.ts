import { AccountType } from '@draco/shared-schemas';
import {
  RepositoryFactory,
  IAccountRepository,
  dbAccountAffiliation,
  dbAccount,
} from '../repositories/index.js';
import { AccountResponseFormatter } from '../utils/responseFormatters.js';
import { NotFoundError } from '../utils/customErrors.js';

export class AccountsService {
  private readonly accountRepository: IAccountRepository;

  constructor() {
    this.accountRepository = RepositoryFactory.getAccountRepository();
  }

  async searchAccounts(searchTerm: string): Promise<AccountType[]> {
    const normalizedSearchTerm = searchTerm.trim();
    const accounts: dbAccount[] = await this.accountRepository.searchByTerm(normalizedSearchTerm);

    if (accounts.length === 0) {
      return [];
    }

    const affiliationIds = Array.from(
      new Set(
        accounts
          .map((account) => account.affiliationid)
          .filter((affiliationId): affiliationId is bigint => affiliationId !== null),
      ),
    );

    let affiliations: dbAccountAffiliation[] = [];
    if (affiliationIds.length > 0) {
      affiliations = await this.accountRepository.findAffiliationsByIds(affiliationIds);
    }

    const affiliationMap = new Map<string, dbAccountAffiliation>(
      affiliations.map((affiliation) => [affiliation.id.toString(), affiliation]),
    );

    return AccountResponseFormatter.formatAccounts(accounts, affiliationMap);
  }

  async getAccountByDomain(host: string): Promise<AccountType> {
    const normalizedHost = host.trim().toLowerCase();
    const withoutWww = normalizedHost.replace(/^www\./, '');

    const urlVariants = Array.from(
      new Set([
        `http://${normalizedHost}`,
        `https://${normalizedHost}`,
        `http://www.${withoutWww}`,
        `https://www.${withoutWww}`,
        `http://${withoutWww}`,
        `https://${withoutWww}`,
      ]),
    );

    const account = await this.accountRepository.findAccountByUrls(urlVariants);

    if (!account) {
      throw new NotFoundError('No account found for this domain');
    }

    const affiliationIds = account.affiliationid ? [account.affiliationid] : [];
    const affiliations: dbAccountAffiliation[] = affiliationIds.length
      ? await this.accountRepository.findAffiliationsByIds(affiliationIds)
      : [];

    const affiliationMap = new Map<string, dbAccountAffiliation>(
      affiliations.map((affiliation) => [affiliation.id.toString(), affiliation]),
    );

    return AccountResponseFormatter.formatAccount(account, affiliationMap);
  }
}
