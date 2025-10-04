import { contacts } from '@prisma/client';
import { IBaseRepository } from './IBaseRepository.js';
import {
  dbBaseContact,
  dbContactWithAccountRoles,
  dbContactWithRoleAndDetails,
  dbRosterPlayer,
} from '../types/dbTypes.js';
import { ContactQueryOptions } from '../../interfaces/contactInterfaces.js';

export interface IContactRepository extends IBaseRepository<contacts> {
  findRosterByContactId(contactId: bigint): Promise<dbRosterPlayer | null>;
  findContactInAccount(contactId: bigint, accountId: bigint): Promise<dbBaseContact | null>;
  findAccountOwner(accountId: bigint): Promise<dbBaseContact | null>;
  isAccountOwner(contactId: bigint, accountId: bigint): Promise<boolean>;
  findByUserId(userId: string, accountId: bigint): Promise<dbBaseContact | null>;
  findContactsByUserIds(userIds: string[]): Promise<dbBaseContact[]>;
  findContactsWithRolesByAccountId(accountId: bigint): Promise<dbContactWithAccountRoles[]>;
  searchContactsWithRoles(
    accountId: bigint,
    options: ContactQueryOptions,
    seasonId?: bigint | null,
  ): Promise<dbContactWithRoleAndDetails[]>;
  searchContactsByName(
    accountId: bigint,
    options: ContactQueryOptions,
  ): Promise<{ contacts: dbBaseContact[]; total: number }>;
}
