import {
  AccountHeaderType,
  AccountNameType,
  AccountSocialsType,
  AccountType,
  AccountWithSeasonsType,
} from '@draco/shared-schemas';
import { accounts } from '@prisma/client';
import {
  RepositoryFactory,
  IAccountRepository,
  dbAccountAffiliation,
  dbAccount,
  dbBaseContact,
  IContactRepository,
  IUserRepository,
  IRoleRepository,
  dbGlobalRoles,
  ISeasonRepository,
} from '../repositories/index.js';
import { AccountResponseFormatter } from '../utils/responseFormatters.js';
import { NotFoundError } from '../utils/customErrors.js';
import { ROLE_IDS } from '../config/roles.js';
import { RoleNamesType } from '../types/roles.js';
import { getAccountLogoUrl } from '../config/logo.js';

type CreateAccountPayload = {
  name: string;
  accountTypeId: string;
  ownerUserId: string;
  affiliationId: string;
  timezoneId: string;
  firstYear?: number;
  urls: string[];
  socials?: AccountSocialsType;
};

type UpdateAccountPayload = {
  name?: string;
  accountTypeId?: string;
  affiliationId?: string;
  timezoneId?: string;
  firstYear?: number;
  youtubeUserId?: string | null;
  facebookFanPage?: string | null;
  defaultVideo?: string | null;
  autoPlayVideo?: boolean;
  twitterAccountName?: string | null;
};

export class AccountsService {
  private readonly accountRepository: IAccountRepository;
  private readonly contactRepository: IContactRepository;
  private readonly userRepository: IUserRepository;
  private readonly roleRepository: IRoleRepository;
  private readonly seasonRepository: ISeasonRepository;

  constructor() {
    this.accountRepository = RepositoryFactory.getAccountRepository();
    this.contactRepository = RepositoryFactory.getContactRepository();
    this.userRepository = RepositoryFactory.getUserRepository();
    this.roleRepository = RepositoryFactory.getRoleRepository();
    this.seasonRepository = RepositoryFactory.getSeasonRepository();
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
    return this.formatAccounts(accounts);
  }

  async getManagedAccountsForUser(userId: string): Promise<AccountType[]> {
    const adminRoleId = ROLE_IDS[RoleNamesType.ADMINISTRATOR] || RoleNamesType.ADMINISTRATOR;
    const globalRoles: dbGlobalRoles[] = await this.roleRepository.findGlobalRoles(userId);
    const hasAdministratorRole = globalRoles.some((role) => role.roleid === adminRoleId);

    if (hasAdministratorRole) {
      const accounts = await this.accountRepository.findAccountsWithRelations();
      return this.formatAccounts(accounts);
    }

    const accountAdminRoleId = ROLE_IDS[RoleNamesType.ACCOUNT_ADMIN] || RoleNamesType.ACCOUNT_ADMIN;

    const managedAccountIds = await this.roleRepository.findAccountIdsForUserRoles(userId, [
      accountAdminRoleId,
    ]);

    if (managedAccountIds.length === 0) {
      return [];
    }

    const accounts = await this.accountRepository.findAccountsWithRelations(managedAccountIds);
    return this.formatAccounts(accounts);
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

  async getAccountById(
    accountId: bigint,
    options?: { includeCurrentSeason?: boolean },
  ): Promise<AccountWithSeasonsType> {
    const account = await this.accountRepository.findAccountWithRelationsById(accountId);

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    const affiliationIds = account.affiliationid ? [account.affiliationid] : [];
    const affiliations = affiliationIds.length
      ? await this.accountRepository.findAffiliationsByIds(affiliationIds)
      : [];

    const affiliationMap = new Map<string, dbAccountAffiliation>(
      affiliations.map((affiliation) => [affiliation.id.toString(), affiliation]),
    );

    const formattedAccount = AccountResponseFormatter.formatAccount(account, affiliationMap);

    const includeCurrentSeason = options?.includeCurrentSeason ?? false;
    const currentSeasonRecord = await this.seasonRepository.findCurrentSeason(accountId);

    const currentSeason = currentSeasonRecord
      ? {
          id: currentSeasonRecord.id.toString(),
          name: currentSeasonRecord.name,
        }
      : null;

    const seasons =
      includeCurrentSeason && currentSeason
        ? [
            {
              ...currentSeason,
              isCurrent: true,
            },
          ]
        : [];

    return {
      account: formattedAccount,
      currentSeason,
      seasons,
    };
  }

  async createAccount(payload: CreateAccountPayload): Promise<AccountType> {
    const {
      name,
      accountTypeId,
      ownerUserId,
      affiliationId,
      timezoneId,
      firstYear,
      urls,
      socials,
    } = payload;

    const accountCreateData: Partial<accounts> = {
      name,
      accounttypeid: BigInt(accountTypeId),
      owneruserid: ownerUserId,
      affiliationid: BigInt(affiliationId),
      timezoneid: timezoneId,
      firstyear: firstYear ?? new Date().getFullYear(),
      twitteraccountname: socials?.twitterAccountName ?? '',
      twitteroauthtoken: '',
      twitteroauthsecretkey: '',
      defaultvideo: socials?.defaultVideo ?? '',
      autoplayvideo: socials?.autoPlayVideo ?? false,
      youtubeuserid: socials?.youtubeUserId ?? null,
      facebookfanpage: socials?.facebookFanPage ?? null,
    };

    const accountRecord = await this.accountRepository.create(accountCreateData);

    const normalizedUrls = urls.filter((url) => url.trim().length > 0);
    for (const url of normalizedUrls) {
      await this.accountRepository.createAccountUrl(accountRecord.id, url);
    }

    return this.buildAccountResponse(accountRecord.id);
  }

  async updateAccount(accountId: bigint, payload: UpdateAccountPayload): Promise<AccountType> {
    const existingAccount = await this.accountRepository.findById(accountId);

    if (!existingAccount) {
      throw new NotFoundError('Account not found');
    }

    const updateData: Partial<accounts> = {};

    if (payload.name !== undefined) {
      updateData.name = payload.name;
    }

    if (payload.accountTypeId !== undefined) {
      updateData.accounttypeid = BigInt(payload.accountTypeId);
    }

    if (payload.affiliationId !== undefined) {
      updateData.affiliationid = BigInt(payload.affiliationId);
    }

    if (payload.timezoneId !== undefined) {
      updateData.timezoneid = payload.timezoneId;
    }

    if (payload.firstYear !== undefined) {
      updateData.firstyear = payload.firstYear;
    }

    if (payload.twitterAccountName !== undefined) {
      updateData.twitteraccountname = payload.twitterAccountName ?? '';
    }

    if (payload.youtubeUserId !== undefined) {
      updateData.youtubeuserid = payload.youtubeUserId ?? null;
    }

    if (payload.facebookFanPage !== undefined) {
      updateData.facebookfanpage = payload.facebookFanPage ?? null;
    }

    if (payload.defaultVideo !== undefined) {
      updateData.defaultvideo = payload.defaultVideo ?? '';
    }

    if (payload.autoPlayVideo !== undefined) {
      updateData.autoplayvideo = payload.autoPlayVideo;
    }

    if (Object.keys(updateData).length === 0) {
      return this.buildAccountResponse(accountId);
    }

    await this.accountRepository.update(accountId, updateData);

    return this.buildAccountResponse(accountId);
  }

  async deleteAccount(accountId: bigint): Promise<void> {
    const existingAccount = await this.accountRepository.findById(accountId);

    if (!existingAccount) {
      throw new NotFoundError('Account not found');
    }

    await this.accountRepository.delete(accountId);
  }

  async getAccountName(accountId: bigint): Promise<AccountNameType> {
    const account = await this.accountRepository.findById(accountId);

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    return {
      id: account.id.toString(),
      name: account.name,
    };
  }

  async getAccountHeader(accountId: bigint): Promise<AccountHeaderType> {
    const account = await this.accountRepository.findById(accountId);

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    return {
      id: account.id.toString(),
      name: account.name,
      accountLogoUrl: getAccountLogoUrl(account.id.toString()),
    };
  }

  private async buildAccountResponse(accountId: bigint): Promise<AccountType> {
    const account = await this.accountRepository.findAccountWithRelationsById(accountId);

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    const affiliationIds = account.affiliationid ? [account.affiliationid] : [];
    const affiliations = affiliationIds.length
      ? await this.accountRepository.findAffiliationsByIds(affiliationIds)
      : [];

    const affiliationMap = new Map<string, dbAccountAffiliation>(
      affiliations.map((affiliation) => [affiliation.id.toString(), affiliation]),
    );

    const ownerUserId = account.owneruserid ?? null;

    let ownerContact: dbBaseContact | undefined;
    let ownerUser:
      | {
          id: string;
          userName: string;
        }
      | undefined;

    if (ownerUserId) {
      const [contact, user] = await Promise.all([
        this.contactRepository.findByUserId(ownerUserId, accountId),
        this.userRepository.findByUserId(ownerUserId),
      ]);

      if (contact) {
        ownerContact = contact;
      }

      if (user) {
        ownerUser = {
          id: user.id,
          userName: user.username ?? ownerUserId,
        };
      } else {
        ownerUser = {
          id: ownerUserId,
          userName: ownerUserId,
        };
      }
    }

    return AccountResponseFormatter.formatAccount(account, affiliationMap, ownerContact, ownerUser);
  }

  private async formatAccounts(accounts: dbAccount[]): Promise<AccountType[]> {
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
}
