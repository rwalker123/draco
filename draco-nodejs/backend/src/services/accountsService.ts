import {
  AccountHeaderType,
  AccountNameType,
  AccountType,
  AccountTypeReference,
  AccountAffiliationType,
  AccountUrlType,
  AccountTwitterSettingsType,
  AccountWithSeasonsType,
  CreateAccountType,
  CreateAccountUrlType,
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
import {
  AccountOwnerDetailsByAccount,
  AccountOwnerSummary,
  AccountResponseFormatter,
} from '../responseFormatters/index.js';
import { ConflictError, NotFoundError, ValidationError } from '../utils/customErrors.js';
import { ROLE_IDS } from '../config/roles.js';
import { RoleNamesType } from '../types/roles.js';
import { getAccountLogoUrl } from '../config/logo.js';

type OwnerSummary = AccountOwnerSummary;

type OwnerDetailsByAccount = AccountOwnerDetailsByAccount;

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

    if (!accounts.length) {
      return [];
    }

    const [affiliationMap, ownerDetails] = await Promise.all([
      this.buildAffiliationMap(accounts),
      this.buildOwnerDetailsByAccount(accounts),
    ]);

    return AccountResponseFormatter.formatAccounts(accounts, affiliationMap, ownerDetails);
  }

  async getManagedAccountsForUser(userId: string): Promise<AccountType[]> {
    const adminRoleId = ROLE_IDS[RoleNamesType.ADMINISTRATOR] || RoleNamesType.ADMINISTRATOR;
    const globalRoles: dbGlobalRoles[] = await this.roleRepository.findGlobalRoles(userId);
    const hasAdministratorRole = globalRoles.some((role) => role.roleid === adminRoleId);

    let accounts: dbAccount[] = [];

    if (hasAdministratorRole) {
      accounts = await this.accountRepository.findAccountsWithRelations();
    } else {
      const accountAdminRoleId =
        ROLE_IDS[RoleNamesType.ACCOUNT_ADMIN] || RoleNamesType.ACCOUNT_ADMIN;

      const managedAccountIds = await this.roleRepository.findAccountIdsForUserRoles(userId, [
        accountAdminRoleId,
      ]);

      if (managedAccountIds.length === 0) {
        return [];
      }

      accounts = await this.accountRepository.findAccountsWithRelations(managedAccountIds);
    }

    if (!accounts.length) {
      return [];
    }

    const [affiliationMap, ownerDetails] = await Promise.all([
      this.buildAffiliationMap(accounts),
      this.buildOwnerDetailsByAccount(accounts),
    ]);

    return AccountResponseFormatter.formatAccounts(accounts, affiliationMap, ownerDetails);
  }

  async searchAccounts(searchTerm: string): Promise<AccountType[]> {
    const normalizedSearchTerm = searchTerm.trim();
    const accounts: dbAccount[] = await this.accountRepository.searchByTerm(normalizedSearchTerm);

    if (accounts.length === 0) {
      return [];
    }

    const affiliationMap = await this.buildAffiliationMap(accounts);

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
        `https://${withoutWww}`,
        `http://${withoutWww}`,
        `https://${withoutWww}`,
      ]),
    );

    const account = await this.accountRepository.findAccountByUrls(urlVariants);

    if (!account) {
      throw new NotFoundError('No account found for this domain');
    }

    const affiliationMap = await this.buildAffiliationMap([account]);

    return AccountResponseFormatter.formatAccount(account, affiliationMap);
  }

  async getAccountById(
    accountId: bigint,
    options?: { includeCurrentSeason?: boolean },
  ): Promise<AccountWithSeasonsType> {
    const { account, affiliationMap, ownerContact, ownerUser } =
      await this.loadAccountContext(accountId);

    const formattedAccount = AccountResponseFormatter.formatAccount(
      account,
      affiliationMap,
      ownerContact,
      ownerUser,
    );

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

  async createAccount(
    accountOwnerUserId: string,
    payload: CreateAccountType,
  ): Promise<AccountType> {
    if (!accountOwnerUserId) {
      throw new ValidationError('Account owner user ID is required');
    }

    const accountTypeId = payload.configuration?.accountType?.id;
    if (!accountTypeId) {
      throw new ValidationError('Account type is required');
    }

    const affiliationId = payload.configuration?.affiliation?.id ?? '1';

    const accountCreateData: Partial<accounts> = {
      name: payload.name,
      accounttypeid: BigInt(accountTypeId),
      owneruserid: accountOwnerUserId,
      affiliationid: BigInt(affiliationId),
      timezoneid: payload.configuration?.timezoneId ?? 'UTC',
      firstyear: payload.configuration?.firstYear ?? new Date().getFullYear(),
      twitteraccountname: payload.socials?.twitterAccountName ?? '',
      twitteroauthtoken: '',
      twitteroauthsecretkey: '',
      defaultvideo: payload.socials?.defaultVideo ?? '',
      autoplayvideo: payload.socials?.autoPlayVideo ?? false,
      youtubeuserid: payload.socials?.youtubeUserId ?? null,
      facebookfanpage: payload.socials?.facebookFanPage ?? null,
    };

    const accountRecord = await this.accountRepository.create(accountCreateData);

    const normalizedUrls = Array.from(
      new Set(
        payload.urls
          .map((url) => url.url)
          .filter((url): url is string => Boolean(url && url.length > 0))
          .map((url) => this.normalizeAccountUrl(url)),
      ),
    );

    for (const url of normalizedUrls) {
      await this.accountRepository.createAccountUrl(accountRecord.id, url);
    }

    const { account, affiliationMap, ownerContact, ownerUser } = await this.loadAccountContext(
      accountRecord.id,
    );

    return AccountResponseFormatter.formatAccount(account, affiliationMap, ownerContact, ownerUser);
  }

  async updateAccount(accountId: bigint, payload: CreateAccountType): Promise<AccountType> {
    await this.ensureAccountExists(accountId);

    const updateData: Partial<accounts> = {};

    if (payload.name !== undefined) {
      updateData.name = payload.name;
    }

    if (payload.configuration?.accountType?.id !== undefined) {
      const accountTypeId = payload.configuration?.accountType?.id;
      if (accountTypeId) {
        updateData.accounttypeid = BigInt(accountTypeId);
      }
    }

    if (payload.configuration?.affiliation?.id !== undefined) {
      const affiliationId = payload.configuration?.affiliation?.id;
      if (affiliationId) {
        updateData.affiliationid = BigInt(affiliationId);
      }
    }

    if (payload.configuration?.timezoneId !== undefined) {
      updateData.timezoneid = payload.configuration?.timezoneId ?? '';
    }

    if (payload.configuration?.firstYear !== undefined) {
      updateData.firstyear = payload.configuration?.firstYear ?? new Date().getFullYear();
    }

    if (payload.socials?.twitterAccountName !== undefined) {
      updateData.twitteraccountname = payload.socials?.twitterAccountName ?? '';
    }

    if (payload.socials?.youtubeUserId !== undefined) {
      updateData.youtubeuserid = payload.socials?.youtubeUserId ?? null;
    }

    if (payload.socials?.facebookFanPage !== undefined) {
      updateData.facebookfanpage = payload.socials?.facebookFanPage ?? null;
    }

    if (payload.socials?.defaultVideo !== undefined) {
      updateData.defaultvideo = payload.socials?.defaultVideo ?? '';
    }

    if (payload.socials?.autoPlayVideo !== undefined) {
      updateData.autoplayvideo = payload.socials?.autoPlayVideo ?? false;
    }

    if (Object.keys(updateData).length > 0) {
      await this.accountRepository.update(accountId, updateData);
    }

    const { account, affiliationMap, ownerContact, ownerUser } =
      await this.loadAccountContext(accountId);

    return AccountResponseFormatter.formatAccount(account, affiliationMap, ownerContact, ownerUser);
  }

  async deleteAccount(accountId: bigint): Promise<void> {
    await this.ensureAccountExists(accountId);
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

  async getAccountTypes(): Promise<AccountTypeReference[]> {
    const accountTypes = await this.accountRepository.findAllAccountTypes();
    return AccountResponseFormatter.formatAccountTypes(accountTypes);
  }

  async getAccountAffiliations(): Promise<AccountAffiliationType[]> {
    const affiliations = await this.accountRepository.findAllAffiliations();
    return AccountResponseFormatter.formatAccountAffiliations(affiliations);
  }

  async getAccountUrls(accountId: bigint): Promise<AccountUrlType[]> {
    await this.ensureAccountExists(accountId);
    const urls = await this.accountRepository.findAccountUrls(accountId);
    return AccountResponseFormatter.formatAccountUrls(urls);
  }

  async addAccountUrl(accountId: bigint, urlData: CreateAccountUrlType): Promise<AccountUrlType> {
    if (!urlData.url) {
      throw new ValidationError('URL is required');
    }

    await this.ensureAccountExists(accountId);

    const normalizedUrl = this.normalizeAccountUrl(urlData.url);

    const existingUrl = await this.accountRepository.findAccountUrlByValue(
      accountId,
      normalizedUrl,
    );

    if (existingUrl) {
      throw new ConflictError('This URL is already associated with this account');
    }

    const createdUrl = await this.accountRepository.createAccountUrl(accountId, normalizedUrl);

    return AccountResponseFormatter.formatAccountUrl(createdUrl);
  }

  async updateAccountUrl(
    accountId: bigint,
    urlId: bigint,
    urlData: CreateAccountUrlType,
  ): Promise<AccountUrlType> {
    if (!urlData.url) {
      throw new ValidationError('URL is required');
    }

    const existingUrl = await this.accountRepository.findAccountUrlById(accountId, urlId);

    if (!existingUrl) {
      throw new NotFoundError('URL not found or does not belong to this account');
    }

    const normalizedUrl = this.normalizeAccountUrl(urlData.url);

    const duplicateUrl = await this.accountRepository.findAccountUrlByValue(
      accountId,
      normalizedUrl,
      urlId,
    );

    if (duplicateUrl) {
      throw new ConflictError('This URL is already associated with this account');
    }

    const updatedUrl = await this.accountRepository.updateAccountUrl(urlId, normalizedUrl);

    return AccountResponseFormatter.formatAccountUrl(updatedUrl);
  }

  async deleteAccountUrl(accountId: bigint, urlId: bigint): Promise<void> {
    const existingUrl = await this.accountRepository.findAccountUrlById(accountId, urlId);

    if (!existingUrl) {
      throw new NotFoundError('URL not found or does not belong to this account');
    }

    await this.accountRepository.deleteAccountUrl(urlId);
  }

  async updateAccountTwitterSettings(
    accountId: bigint,
    twitterSettings: AccountTwitterSettingsType,
  ): Promise<AccountType> {
    const hasUpdates = Object.values(twitterSettings).some(
      (value) => value !== undefined && value !== null,
    );

    if (!hasUpdates) {
      throw new ValidationError('At least one Twitter field to update is required');
    }

    await this.ensureAccountExists(accountId);

    const updateData: Partial<accounts> = {};

    if (twitterSettings.twitterAccountName !== undefined) {
      updateData.twitteraccountname = twitterSettings.twitterAccountName;
    }

    if (twitterSettings.twitterOauthToken !== undefined) {
      updateData.twitteroauthtoken = twitterSettings.twitterOauthToken;
    }

    if (twitterSettings.twitterOauthSecretKey !== undefined) {
      updateData.twitteroauthsecretkey = twitterSettings.twitterOauthSecretKey;
    }

    if (twitterSettings.twitterWidgetScript !== undefined) {
      updateData.twitterwidgetscript = twitterSettings.twitterWidgetScript;
    }

    await this.accountRepository.update(accountId, updateData);

    const { account, affiliationMap, ownerContact, ownerUser } =
      await this.loadAccountContext(accountId);

    return AccountResponseFormatter.formatAccount(account, affiliationMap, ownerContact, ownerUser);
  }

  private async loadAccountContext(accountId: bigint): Promise<{
    account: dbAccount;
    affiliationMap: Map<string, dbAccountAffiliation>;
    ownerContact?: dbBaseContact;
    ownerUser?: OwnerSummary;
  }> {
    const account = await this.accountRepository.findAccountWithRelationsById(accountId);

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    const [affiliationMap, ownerDetails] = await Promise.all([
      this.buildAffiliationMap([account]),
      this.buildOwnerDetailsByAccount([account]),
    ]);

    const accountKey = account.id.toString();

    return {
      account,
      affiliationMap,
      ownerContact: ownerDetails.ownerContacts?.get(accountKey),
      ownerUser: ownerDetails.ownerUsersByAccount?.get(accountKey),
    };
  }

  private async buildAffiliationMap(
    accounts: dbAccount[],
  ): Promise<Map<string, dbAccountAffiliation>> {
    if (accounts.length === 0) {
      return new Map();
    }

    const affiliationIds = Array.from(
      new Set(
        accounts
          .map((account) => account.affiliationid)
          .filter((affiliationId): affiliationId is bigint => affiliationId !== null),
      ),
    );

    if (!affiliationIds.length) {
      return new Map();
    }

    const affiliations = await this.accountRepository.findAffiliationsByIds(affiliationIds);

    return new Map(affiliations.map((affiliation) => [affiliation.id.toString(), affiliation]));
  }

  private async buildOwnerDetailsByAccount(accounts: dbAccount[]): Promise<OwnerDetailsByAccount> {
    if (accounts.length === 0) {
      return {};
    }

    const ownerUserIds = Array.from(
      new Set(
        accounts
          .map((account) => account.owneruserid)
          .filter(
            (ownerId): ownerId is string => typeof ownerId === 'string' && ownerId.length > 0,
          ),
      ),
    );

    if (ownerUserIds.length === 0) {
      return {};
    }

    const [ownerContacts, ownerUsers] = await Promise.all([
      this.contactRepository.findContactsByUserIds(ownerUserIds),
      this.userRepository.findMany({ id: { in: ownerUserIds } }),
    ]);

    const ownerContactsByAccount = new Map<string, dbBaseContact>();
    const ownerUsersByAccount = new Map<string, OwnerSummary>();

    accounts.forEach((account) => {
      if (!account.owneruserid) {
        return;
      }

      const accountIdStr = account.id.toString();

      const contact = ownerContacts.find(
        (ownerContact) =>
          ownerContact.userid === account.owneruserid &&
          ownerContact.creatoraccountid === account.id,
      );

      if (contact) {
        ownerContactsByAccount.set(accountIdStr, contact);
      }

      const userRecord = ownerUsers.find((user) => user.id === account.owneruserid);

      ownerUsersByAccount.set(accountIdStr, {
        id: userRecord?.id ?? account.owneruserid,
        userName: userRecord?.username ?? account.owneruserid,
      });
    });

    const ownerDetails: OwnerDetailsByAccount = {};

    if (ownerContactsByAccount.size) {
      ownerDetails.ownerContacts = ownerContactsByAccount;
    }

    if (ownerUsersByAccount.size) {
      ownerDetails.ownerUsersByAccount = ownerUsersByAccount;
    }

    return ownerDetails;
  }

  private async ensureAccountExists(accountId: bigint): Promise<accounts> {
    const account = await this.accountRepository.findById(accountId);

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    return account;
  }

  private normalizeAccountUrl(url: string): string {
    return url.trim().toLowerCase();
  }
}
