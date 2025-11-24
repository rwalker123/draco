import {
  AccountAffiliationType,
  AccountDiscordIntegrationType,
  AccountType,
  AccountTypeReference,
  AccountUrlType,
} from '@draco/shared-schemas';
import { getAccountLogoUrl } from '../config/logo.js';
import {
  dbAccount,
  dbAccountAffiliation,
  dbAccountTypeRecord,
  dbAccountUrl,
  dbBaseContact,
} from '../repositories/index.js';

export type AccountOwnerSummary = {
  id: string;
  userName: string;
};

export type AccountOwnerDetailsByAccount = {
  ownerContacts?: Map<string, dbBaseContact>;
  ownerUsersByAccount?: Map<string, AccountOwnerSummary>;
};

type AccountFormatOptions = {
  discordIntegration?: AccountDiscordIntegrationType;
};

export class AccountResponseFormatter {
  static formatAccounts(
    accounts: dbAccount[],
    affiliationMap: Map<string, dbAccountAffiliation>,
    ownerDetails?: AccountOwnerDetailsByAccount,
  ): AccountType[] {
    return accounts.map((account) => {
      const accountId = account.id.toString();
      const ownerContact = ownerDetails?.ownerContacts?.get(accountId);
      const ownerUser = ownerDetails?.ownerUsersByAccount?.get(accountId);
      return this.formatAccount(account, affiliationMap, ownerContact, ownerUser);
    });
  }

  static formatAccount(
    account: dbAccount,
    affiliationMap: Map<string, dbAccountAffiliation>,
    ownerContact?: dbBaseContact,
    ownerUser?: AccountOwnerSummary,
    options?: AccountFormatOptions,
  ): AccountType {
    const affiliationId = account.affiliationid ? account.affiliationid.toString() : undefined;
    const affiliationRecord = affiliationId ? affiliationMap.get(affiliationId) : undefined;

    const formattedAccount: AccountType = {
      id: account.id.toString(),
      name: account.name,
      accountLogoUrl: getAccountLogoUrl(account.id.toString()),
      configuration: {
        accountType: account.accounttypes
          ? {
              id: account.accounttypes.id.toString(),
              name: account.accounttypes.name,
            }
          : undefined,
        affiliation: affiliationRecord
          ? {
              id: affiliationRecord.id.toString(),
              name: affiliationRecord.name,
              url: affiliationRecord.url,
            }
          : undefined,
        firstYear: account.firstyear,
        timeZone: account.timezoneid,
      },
      socials: {
        autoPlayVideo: account.autoplayvideo,
        twitterAccountName: account.accounttwittercredentials?.handle ?? undefined,
        twitterConnected: Boolean(account.accounttwittercredentials?.useraccesstoken),
        blueskyHandle: account.blueskyhandle || undefined,
        facebookFanPage: account.facebookfanpage ?? undefined,
        youtubeUserId: account.youtubeuserid,
        defaultVideo: account.defaultvideo,
      },
      urls: account.accountsurl.map((url) => ({
        id: url.id.toString(),
        url: url.url,
      })),
    };

    if (options?.discordIntegration) {
      formattedAccount.discordIntegration = options.discordIntegration;
    }

    if (ownerContact || ownerUser) {
      formattedAccount.accountOwner = {
        contact: ownerContact
          ? {
              id: ownerContact.id.toString(),
              firstName: ownerContact.firstname,
              lastName: ownerContact.lastname,
              middleName: ownerContact.middlename ?? undefined,
            }
          : undefined,
        user: ownerUser
          ? {
              userId: ownerUser.id,
              userName: ownerUser.userName,
            }
          : undefined,
      };
    }

    return formattedAccount;
  }

  static formatAccountTypes(accountTypes: dbAccountTypeRecord[]): AccountTypeReference[] {
    return accountTypes.map((accountType) => ({
      id: accountType.id.toString(),
      name: accountType.name,
    }));
  }

  static formatAccountAffiliations(affiliations: dbAccountAffiliation[]): AccountAffiliationType[] {
    return affiliations.map((affiliation) => ({
      id: affiliation.id.toString(),
      name: affiliation.name,
      url: affiliation.url,
    }));
  }

  static formatAccountUrls(accountUrls: dbAccountUrl[]): AccountUrlType[] {
    return accountUrls.map((accountUrl) => this.formatAccountUrl(accountUrl));
  }

  static formatAccountUrl(accountUrl: dbAccountUrl): AccountUrlType {
    return {
      id: accountUrl.id.toString(),
      url: accountUrl.url,
    };
  }
}
