import { contacts } from '#prisma/client';
import { IBaseRepository } from './IBaseRepository.js';
import {
  dbBaseContact,
  dbContactWithAccountRoles,
  dbContactWithRoleAndDetails,
  dbRosterPlayer,
  dbBirthdayContact,
  dbContactExportData,
} from '../types/dbTypes.js';
import { ContactQueryOptions } from '../../interfaces/contactInterfaces.js';

export interface ContactExportOptions {
  searchTerm?: string;
  onlyWithRoles?: boolean;
  seasonId?: bigint;
}

export interface ActiveRosterContactFilters {
  birthdayOn?: {
    month: number;
    day: number;
  };
}

export interface IContactRepository extends IBaseRepository<contacts> {
  findRosterByContactId(contactId: bigint): Promise<dbRosterPlayer | null>;
  findContactInAccount(contactId: bigint, accountId: bigint): Promise<dbBaseContact | null>;
  findAccountOwner(accountId: bigint): Promise<dbBaseContact | null>;
  isAccountOwner(contactId: bigint, accountId: bigint): Promise<boolean>;
  findByUserId(userId: string, accountId: bigint): Promise<dbBaseContact | null>;
  findContactsByUserIds(userIds: string[]): Promise<dbBaseContact[]>;
  findContactsWithRolesByAccountId(accountId: bigint): Promise<dbContactWithAccountRoles[]>;
  findActiveSeasonRosterContacts(
    accountId: bigint,
    seasonId: bigint,
    filters?: ActiveRosterContactFilters,
  ): Promise<dbBirthdayContact[]>;
  searchContactsWithRoles(
    accountId: bigint,
    options: ContactQueryOptions,
    seasonId?: bigint | null,
  ): Promise<dbContactWithRoleAndDetails[]>;
  searchContactsByName(
    accountId: bigint,
    options: ContactQueryOptions,
  ): Promise<{ contacts: dbBaseContact[]; total: number }>;
  findAvailableContacts(
    accountId: bigint,
    excludedContactIds: bigint[],
    firstName: string | undefined,
    lastName: string | undefined,
    skip: number,
    take: number,
  ): Promise<dbBaseContact[]>;
  findContactsForExport(
    accountId: bigint,
    options: ContactExportOptions,
  ): Promise<dbContactExportData[]>;
}
