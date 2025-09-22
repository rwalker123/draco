import { AccountType } from '@draco/shared-schemas';
import {
  RepositoryFactory,
  IAccountRepository,
  dbAccountAffiliation,
  dbAccount,
  dbBaseContact,
  IContactRepository,
  IUserRepository,
} from '../repositories/index.js';
import { AccountResponseFormatter } from '../utils/responseFormatters.js';
import { NotFoundError } from '../utils/customErrors.js';

export class AccountsService {
  private readonly accountRepository: IAccountRepository;
  private readonly contactRepository: IContactRepository;
  private readonly userRepository: IUserRepository;

  constructor() {
    this.accountRepository = RepositoryFactory.getAccountRepository();
    this.contactRepository = RepositoryFactory.getContactRepository();
    this.userRepository = RepositoryFactory.getUserRepository();
  }

  async getAccountsForUser(userId: string): Promise<AccountType[]> {
    const userContacts = await this.contactRepository.findContactsByUserIds([userId]);

    if (userContacts.length === 0) {
      return [];
    }

    const accountIds = Array.from(
      new Set(
        userContacts
          .map((contact) => contact.creatoraccountid)
          .filter((accountId): accountId is bigint => accountId !== null),
      ),
    );

    if (accountIds.length === 0) {
      return [];
    }

    const accounts = await this.accountRepository.findAccountsWithRelations(accountIds);
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

    const affiliations: dbAccountAffiliation[] = affiliationIds.length
      ? await this.accountRepository.findAffiliationsByIds(affiliationIds)
      : [];

    const affiliationMap = new Map<string, dbAccountAffiliation>(
      affiliations.map((affiliation) => [affiliation.id.toString(), affiliation]),
    );

    const ownerUserIds = Array.from(
      new Set(
        accounts
          .map((account) => account.owneruserid)
          .filter(
            (ownerId): ownerId is string => typeof ownerId === 'string' && ownerId.length > 0,
          ),
      ),
    );

    let ownerContactMap: Map<string, dbBaseContact> | undefined;

    if (ownerUserIds.length > 0) {
      const ownerContacts = await this.contactRepository.findContactsByUserIds(ownerUserIds);

      ownerContactMap = new Map(
        ownerContacts
          .filter((contact) => contact.creatoraccountid !== null)
          .map((contact) => [contact.creatoraccountid!.toString(), contact]),
      );
    }

    let ownerUserMap: Map<string, { id: string; userName: string }> | undefined;

    if (ownerUserIds.length > 0) {
      const ownerUsers = await this.userRepository.findMany({
        id: { in: ownerUserIds },
      });

      ownerUserMap = new Map(
        accounts
          .filter((account) => account.owneruserid)
          .map((account) => {
            const userRecord = ownerUsers.find((user) => user.id === account.owneruserid);
            return [
              account.id.toString(),
              userRecord
                ? {
                    id: userRecord.id,
                    userName: userRecord.username ?? account.owneruserid!,
                  }
                : { id: account.owneruserid!, userName: account.owneruserid! },
            ];
          }),
      );
    }

    return AccountResponseFormatter.formatAccounts(accounts, affiliationMap, {
      ownerContacts: ownerContactMap,
      ownerUsersByAccount: ownerUserMap,
    });
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
