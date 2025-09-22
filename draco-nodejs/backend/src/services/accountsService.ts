import { AccountType } from '@draco/shared-schemas';
import {
  RepositoryFactory,
  IAccountRepository,
  dbAccountAffiliation,
  dbAccountSearchResult,
} from '../repositories/index.js';
import { AccountResponseFormatter } from '../utils/responseFormatters.js';

export class AccountsService {
  private readonly accountRepository: IAccountRepository;

  constructor() {
    this.accountRepository = RepositoryFactory.getAccountRepository();
  }

  async searchAccounts(searchTerm: string): Promise<AccountType[]> {
    const normalizedSearchTerm = searchTerm.trim();
    const accounts: dbAccountSearchResult[] =
      await this.accountRepository.searchByTerm(normalizedSearchTerm);

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

    return AccountResponseFormatter.formatAccountSummaries(accounts, affiliationMap);
  }
}
