import {
  AccountHeaderType,
  AccountNameType,
  AccountType,
  AccountTypeReference,
  AccountAffiliationType,
  AccountUrlType,
  AccountTwitterSettingsType,
  AccountBlueskySettingsType,
  AccountInstagramSettingsType,
  AccountWithSeasonsType,
  CreateAccountType,
  CreateAccountUrlType,
  CreateContactSchema,
  CreateContactType,
  AccountDiscordIntegrationType,
  UpdateAccountType,
  CreateIndividualGolfAccountType,
  CreateAuthenticatedGolfAccountType,
  IndividualGolfAccountResponseType,
  AuthenticatedGolfAccountResponseType,
} from '@draco/shared-schemas';
import { accountblueskycredentials, accounts, contacts } from '#prisma/client';
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
  ISeasonsRepository,
  IAccountTwitterCredentialsRepository,
  IAccountBlueskyCredentialsRepository,
  IAccountInstagramCredentialsRepository,
} from '../repositories/index.js';
import {
  AccountOwnerDetailsByAccount,
  AccountOwnerSummary,
  AccountResponseFormatter,
} from '../responseFormatters/index.js';
import {
  ConflictError,
  NotFoundError,
  NoDomainAccount,
  ValidationError,
} from '../utils/customErrors.js';
import { ROLE_IDS } from '../config/roles.js';
import { encryptSecret } from '../utils/secretEncryption.js';
import { RoleNamesType } from '../types/roles.js';
import { getAccountLogoUrl } from '../config/logo.js';
import { DateUtils } from '../utils/dateUtils.js';
import { ServiceFactory } from './serviceFactory.js';
import { DiscordIntegrationService } from './discordIntegrationService.js';

type OwnerSummary = AccountOwnerSummary;

type OwnerDetailsByAccount = AccountOwnerDetailsByAccount;

export class AccountsService {
  private readonly accountRepository: IAccountRepository;
  private readonly contactRepository: IContactRepository;
  private readonly userRepository: IUserRepository;
  private readonly roleRepository: IRoleRepository;
  private readonly seasonRepository: ISeasonsRepository;
  private readonly discordIntegrationService: DiscordIntegrationService;
  private readonly accountTwitterCredentialsRepository: IAccountTwitterCredentialsRepository;
  private readonly accountBlueskyCredentialsRepository: IAccountBlueskyCredentialsRepository;
  private readonly accountInstagramCredentialsRepository: IAccountInstagramCredentialsRepository;

  constructor() {
    this.accountRepository = RepositoryFactory.getAccountRepository();
    this.contactRepository = RepositoryFactory.getContactRepository();
    this.userRepository = RepositoryFactory.getUserRepository();
    this.roleRepository = RepositoryFactory.getRoleRepository();
    this.seasonRepository = RepositoryFactory.getSeasonsRepository();
    this.discordIntegrationService = ServiceFactory.getDiscordIntegrationService();
    this.accountTwitterCredentialsRepository =
      RepositoryFactory.getAccountTwitterCredentialsRepository();
    this.accountBlueskyCredentialsRepository =
      RepositoryFactory.getAccountBlueskyCredentialsRepository();
    this.accountInstagramCredentialsRepository =
      RepositoryFactory.getAccountInstagramCredentialsRepository();
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

      const [managedAccountIds, ownedAccountRecords] = await Promise.all([
        this.roleRepository.findAccountIdsForUserRoles(userId, [accountAdminRoleId]),
        this.accountRepository.findMany({ owneruserid: userId }),
      ]);

      const managedAccountIdMap = new Map<string, bigint>();
      for (const managedAccountId of managedAccountIds) {
        managedAccountIdMap.set(managedAccountId.toString(), managedAccountId);
      }

      for (const ownedAccount of ownedAccountRecords) {
        managedAccountIdMap.set(ownedAccount.id.toString(), ownedAccount.id);
      }

      if (!managedAccountIdMap.size) {
        return [];
      }

      accounts = await this.accountRepository.findAccountsWithRelations(
        Array.from(managedAccountIdMap.values()),
      );
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
      throw new NoDomainAccount();
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

    let discordIntegration: AccountDiscordIntegrationType | undefined;
    try {
      const config = await this.discordIntegrationService.getAccountConfig(accountId);
      discordIntegration = {
        guildId: config.guildId,
        guildName: config.guildName ?? null,
      };
    } catch (error) {
      console.error('[AccountsService] Unable to load Discord config for account', {
        accountId: accountId.toString(),
        error,
      });
    }

    const formattedAccount = AccountResponseFormatter.formatAccount(
      account,
      affiliationMap,
      ownerContact,
      ownerUser,
      discordIntegration ? { discordIntegration } : undefined,
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
    accountOwnerUserName: string,
    payload: CreateAccountType,
  ): Promise<AccountType> {
    if (!accountOwnerUserId) {
      throw new ValidationError('Account owner user ID is required');
    }

    if (!accountOwnerUserName) {
      throw new ValidationError('Account owner username is required');
    }

    const accountTypeId = payload.configuration?.accountType?.id;
    if (!accountTypeId) {
      throw new ValidationError('Account type is required');
    }

    const affiliationId = payload.configuration?.affiliation?.id ?? '1';

    if (!payload.ownerContact) {
      throw new ValidationError('Owner contact information is required');
    }

    if (!payload.seasonName || payload.seasonName.trim().length === 0) {
      throw new ValidationError('Season name is required');
    }

    const ownerContact = CreateContactSchema.parse(payload.ownerContact);

    const accountCreateData: Partial<accounts> = {
      name: payload.name,
      accounttypeid: BigInt(accountTypeId),
      owneruserid: accountOwnerUserId,
      affiliationid: BigInt(affiliationId),
      timezoneid: payload.configuration?.timeZone ?? 'UTC',
      firstyear: payload.configuration?.firstYear ?? new Date().getFullYear(),
      defaultvideo: payload.socials?.defaultVideo ?? '',
      autoplayvideo: payload.socials?.autoPlayVideo ?? false,
      youtubeuserid: payload.socials?.youtubeUserId ?? null,
      facebookfanpage: payload.socials?.facebookFanPage ?? null,
    };

    const accountRecord = await this.accountRepository.create(accountCreateData);

    await this.createOwnerContact(
      accountRecord.id,
      accountOwnerUserId,
      accountOwnerUserName,
      ownerContact,
    );

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

    const season = await this.seasonRepository.createSeason({
      accountid: accountRecord.id,
      name: payload.seasonName.trim(),
    });

    await this.seasonRepository.upsertCurrentSeason(accountRecord.id, season.id);

    const {
      account,
      affiliationMap,
      ownerContact: ownerContactRecord,
      ownerUser,
    } = await this.loadAccountContext(accountRecord.id);

    return AccountResponseFormatter.formatAccount(
      account,
      affiliationMap,
      ownerContactRecord,
      ownerUser,
    );
  }

  async createIndividualGolfAccount(
    payload: CreateIndividualGolfAccountType,
  ): Promise<IndividualGolfAccountResponseType> {
    const GOLF_INDIVIDUAL_ACCOUNT_TYPE_ID = BigInt(5);
    const NO_AFFILIATION_ID = BigInt(1);
    const DEFAULT_TIMEZONE = 'America/New_York';

    const authService = ServiceFactory.getAuthService();
    const registrationResult = await authService.register(
      { userName: payload.email, password: payload.password },
      { sendWelcomeEmail: true },
    );

    if (!registrationResult.token) {
      throw new ValidationError('Failed to generate authentication token');
    }

    const currentYear = new Date().getFullYear();
    const nameParts = payload.name.trim().split(/\s+/);
    const firstName = nameParts[0] || payload.name;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const accountCreateData: Partial<accounts> = {
      name: `${payload.name}'s Golf`,
      accounttypeid: GOLF_INDIVIDUAL_ACCOUNT_TYPE_ID,
      owneruserid: registrationResult.userId,
      affiliationid: NO_AFFILIATION_ID,
      timezoneid: DEFAULT_TIMEZONE,
      firstyear: currentYear,
      defaultvideo: '',
      autoplayvideo: false,
      youtubeuserid: null,
      facebookfanpage: null,
    };

    const accountRecord = await this.accountRepository.create(accountCreateData);

    const contactRecord: Partial<contacts> = {
      firstname: firstName,
      lastname: lastName,
      middlename: '',
      email: payload.email,
      phone1: null,
      phone2: null,
      phone3: null,
      creatoraccountid: accountRecord.id,
      userid: registrationResult.userId,
      streetaddress: null,
      city: null,
      state: null,
      zip: null,
      dateofbirth: new Date('1900-01-01'),
    };

    await this.contactRepository.create(contactRecord);

    const season = await this.seasonRepository.createSeason({
      accountid: accountRecord.id,
      name: currentYear.toString(),
    });

    await this.seasonRepository.upsertCurrentSeason(accountRecord.id, season.id);

    const {
      account,
      affiliationMap,
      ownerContact: ownerContactRecord,
      ownerUser,
    } = await this.loadAccountContext(accountRecord.id);

    const formattedAccount = AccountResponseFormatter.formatAccount(
      account,
      affiliationMap,
      ownerContactRecord,
      ownerUser,
    );

    return {
      token: registrationResult.token,
      account: formattedAccount,
      userId: registrationResult.userId,
    };
  }

  async createAuthenticatedGolfAccount(
    userId: string,
    userEmail: string,
    payload: CreateAuthenticatedGolfAccountType,
  ): Promise<AuthenticatedGolfAccountResponseType> {
    const GOLF_INDIVIDUAL_ACCOUNT_TYPE_ID = BigInt(5);
    const NO_AFFILIATION_ID = BigInt(1);
    const DEFAULT_TIMEZONE = 'America/New_York';

    let firstName = '';
    let lastName = '';
    let middleName = '';

    if (payload.name) {
      const nameParts = payload.name.trim().split(/\s+/);
      firstName = nameParts[0] || payload.name;
      lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    } else {
      const existingContacts = await this.contactRepository.findContactsByUserIds([userId]);
      if (existingContacts.length > 0) {
        const existingContact = existingContacts[0];
        firstName = existingContact.firstname;
        lastName = existingContact.lastname ?? '';
        middleName = existingContact.middlename ?? '';
      }
    }

    const displayName =
      payload.name?.trim() || [firstName, middleName, lastName].filter(Boolean).join(' ') || 'Golf';
    const currentYear = new Date().getFullYear();

    const accountCreateData: Partial<accounts> = {
      name: `${displayName}'s Golf`,
      accounttypeid: GOLF_INDIVIDUAL_ACCOUNT_TYPE_ID,
      owneruserid: userId,
      affiliationid: NO_AFFILIATION_ID,
      timezoneid: DEFAULT_TIMEZONE,
      firstyear: currentYear,
      defaultvideo: '',
      autoplayvideo: false,
      youtubeuserid: null,
      facebookfanpage: null,
    };

    const accountRecord = await this.accountRepository.create(accountCreateData);

    const contactRecord: Partial<contacts> = {
      firstname: firstName || 'Golf',
      lastname: lastName,
      middlename: middleName,
      email: userEmail,
      phone1: null,
      phone2: null,
      phone3: null,
      creatoraccountid: accountRecord.id,
      userid: userId,
      streetaddress: null,
      city: null,
      state: null,
      zip: null,
      dateofbirth: new Date('1900-01-01'),
    };

    await this.contactRepository.create(contactRecord);

    const season = await this.seasonRepository.createSeason({
      accountid: accountRecord.id,
      name: currentYear.toString(),
    });

    await this.seasonRepository.upsertCurrentSeason(accountRecord.id, season.id);

    const {
      account,
      affiliationMap,
      ownerContact: ownerContactRecord,
      ownerUser,
    } = await this.loadAccountContext(accountRecord.id);

    const formattedAccount = AccountResponseFormatter.formatAccount(
      account,
      affiliationMap,
      ownerContactRecord,
      ownerUser,
    );

    return {
      account: formattedAccount,
      userId,
    };
  }

  async updateAccount(accountId: bigint, payload: UpdateAccountType): Promise<AccountType> {
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

    if (payload.configuration?.timeZone !== undefined) {
      updateData.timezoneid = payload.configuration?.timeZone ?? '';
    }

    if (payload.configuration?.firstYear !== undefined) {
      updateData.firstyear = payload.configuration?.firstYear ?? new Date().getFullYear();
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
    const contacts = await this.contactRepository.findMany({
      creatoraccountid: accountId,
    });

    for (const contact of contacts) {
      await this.contactRepository.delete(contact.id);
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
    const normalizePlain = (value?: string): string | null | undefined => {
      if (value === undefined) {
        return undefined;
      }
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    };

    const normalizeSecret = (value?: string): string | null | undefined => {
      if (value === undefined) {
        return undefined;
      }
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }
      try {
        return encryptSecret(trimmed);
      } catch (error) {
        console.error('Failed to encrypt Twitter credential', error);
        throw new ValidationError('Unable to store Twitter credentials securely');
      }
    };

    const hasUpdates = Object.values(twitterSettings).some(
      (value) => value !== undefined && value !== null,
    );

    if (!hasUpdates) {
      throw new ValidationError('At least one Twitter field to update is required');
    }

    await this.ensureAccountExists(accountId);

    const existing = await this.accountTwitterCredentialsRepository.findByAccountId(accountId);

    const normalizedHandle = normalizePlain(twitterSettings.twitterAccountName);
    if (normalizedHandle === null) {
      throw new ValidationError('Twitter handle cannot be empty');
    }

    const normalizedClientId = normalizePlain(twitterSettings.twitterClientId);
    const updateData = {
      handle: normalizedHandle,
      clientid: normalizedClientId,
      clientsecret: normalizeSecret(twitterSettings.twitterClientSecret),
      ingestionbearertoken: normalizeSecret(twitterSettings.twitterIngestionBearerToken),
    };

    const handleToUse = updateData.handle ?? existing?.handle;
    if (!existing && !handleToUse) {
      throw new ValidationError('Twitter handle is required to save credentials');
    }

    const shouldClearTokens =
      twitterSettings.twitterClientId === '' ||
      twitterSettings.twitterClientSecret === '' ||
      twitterSettings.twitterIngestionBearerToken === '';

    await this.accountTwitterCredentialsRepository.upsertForAccount(accountId, {
      ...updateData,
      handle: handleToUse ?? undefined,
      ...(shouldClearTokens
        ? {
            useraccesstoken: null,
            userrefreshtoken: null,
            useraccesstokenexpiresat: null,
            scope: null,
          }
        : {}),
    });

    const { account, affiliationMap, ownerContact, ownerUser } =
      await this.loadAccountContext(accountId);

    return AccountResponseFormatter.formatAccount(account, affiliationMap, ownerContact, ownerUser);
  }

  async updateAccountInstagramSettings(
    accountId: bigint,
    instagramSettings: AccountInstagramSettingsType,
  ): Promise<AccountType> {
    const normalizePlain = (value?: string): string | null | undefined => {
      if (value === undefined) {
        return undefined;
      }
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    };

    const normalizeSecret = (value?: string): string | null | undefined => {
      if (value === undefined) {
        return undefined;
      }
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }
      try {
        return encryptSecret(trimmed);
      } catch (error) {
        console.error('Failed to encrypt Instagram credential', error);
        throw new ValidationError('Unable to store Instagram credentials securely');
      }
    };

    const hasUpdates = Object.values(instagramSettings).some(
      (value) => value !== undefined && value !== null,
    );

    if (!hasUpdates) {
      throw new ValidationError('At least one Instagram field to update is required');
    }

    await this.ensureAccountExists(accountId);

    const existing = await this.accountInstagramCredentialsRepository.findByAccountId(accountId);

    const normalizedUserId = normalizePlain(instagramSettings.instagramUserId);
    const normalizedUsername = normalizePlain(instagramSettings.instagramUsername);
    const normalizedAppId = normalizePlain(instagramSettings.instagramAppId);
    const normalizedAppSecret = normalizeSecret(instagramSettings.instagramAppSecret);

    const userIdToUse = normalizedUserId ?? existing?.instagramuserid;
    if (!existing && !userIdToUse) {
      throw new ValidationError('Instagram Business/User ID is required to save credentials');
    }

    const shouldClearTokens =
      instagramSettings.instagramAppId === '' || instagramSettings.instagramAppSecret === '';

    await this.accountInstagramCredentialsRepository.upsertForAccount(accountId, {
      instagramuserid: userIdToUse ?? undefined,
      username: normalizedUsername ?? undefined,
      appid: normalizedAppId ?? undefined,
      appsecret: normalizedAppSecret ?? undefined,
      ...(shouldClearTokens
        ? {
            accesstoken: null,
            refreshtoken: null,
            accesstokenexpiresat: null,
          }
        : {}),
    });

    const { account, affiliationMap, ownerContact, ownerUser } =
      await this.loadAccountContext(accountId);

    return AccountResponseFormatter.formatAccount(account, affiliationMap, ownerContact, ownerUser);
  }

  async updateAccountBlueskySettings(
    accountId: bigint,
    blueskySettings: AccountBlueskySettingsType,
  ): Promise<AccountType> {
    const normalizeHandle = (value?: string): string | null | undefined => {
      if (value === undefined) {
        return undefined;
      }

      const trimmed = value.trim().replace(/^@+/, '');
      return trimmed ? trimmed : null;
    };

    const encryptSecretValue = (value?: string): string | undefined => {
      if (value === undefined) {
        return undefined;
      }

      const trimmed = value.trim();
      if (!trimmed) {
        return '';
      }

      try {
        return encryptSecret(trimmed);
      } catch (error) {
        console.error('Failed to encrypt Bluesky credential', error);
        throw new ValidationError('Unable to store Bluesky credentials securely');
      }
    };

    const hasUpdates = Object.values(blueskySettings).some(
      (value) => value !== undefined && value !== null,
    );

    if (!hasUpdates) {
      throw new ValidationError('At least one Bluesky field to update is required');
    }

    await this.ensureAccountExists(accountId);

    const updateData: Partial<accountblueskycredentials> = {};

    if (blueskySettings.blueskyHandle !== undefined) {
      updateData.blueskyhandle = blueskySettings.blueskyHandle ?? '';
    }

    const encryptedAppPassword = encryptSecretValue(blueskySettings.blueskyAppPassword);
    if (encryptedAppPassword !== undefined) {
      updateData.blueskyapppassword = encryptedAppPassword;
    }

    const normalizedHandle = normalizeHandle(blueskySettings.blueskyHandle);

    if (normalizedHandle !== undefined) {
      updateData.blueskyhandle = normalizedHandle ?? '';
    }

    await this.accountBlueskyCredentialsRepository.upsertForAccount(accountId, {
      ...updateData,
      accountid: accountId,
    });

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

  private async createOwnerContact(
    accountId: bigint,
    ownerUserId: string,
    ownerUserName: string,
    contact: CreateContactType,
  ): Promise<void> {
    const contactDetails = contact.contactDetails;
    const normalizedOwnerEmail = ownerUserName.trim();

    const contactRecord: Partial<contacts> = {
      firstname: contact.firstName,
      lastname: contact.lastName,
      middlename: contact.middleName ?? '',
      email: normalizedOwnerEmail.length > 0 ? normalizedOwnerEmail : (contact.email ?? null),
      phone1: contactDetails?.phone1 || null,
      phone2: contactDetails?.phone2 || null,
      phone3: contactDetails?.phone3 || null,
      creatoraccountid: accountId,
      userid: ownerUserId,
      streetaddress: contactDetails?.streetAddress || null,
      city: contactDetails?.city || null,
      state: contactDetails?.state || null,
      zip: contactDetails?.zip || null,
      dateofbirth: contactDetails?.dateOfBirth
        ? DateUtils.parseDateOfBirthForDatabase(contactDetails.dateOfBirth)
        : new Date('1900-01-01'),
    };

    await this.contactRepository.create(contactRecord);
  }
}
