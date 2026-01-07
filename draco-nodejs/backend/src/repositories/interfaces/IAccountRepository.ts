import { accounts } from '#prisma/client';
import { IBaseRepository } from './IBaseRepository.js';
import {
  dbAccountAffiliation,
  dbAccount,
  dbAccountTypeRecord,
  dbAccountUrl,
} from '../types/index.js';

export interface IAccountRepository extends IBaseRepository<accounts> {
  findByOwnerUserIdAndType(ownerUserId: string, accountTypeId: bigint): Promise<accounts | null>;

  findByDomain(domain: string): Promise<accounts | null>;
  findBySubdomain(subdomain: string): Promise<accounts | null>;
  searchByTerm(searchTerm: string, limit?: number): Promise<dbAccount[]>;
  findAffiliationsByIds(ids: bigint[]): Promise<dbAccountAffiliation[]>;
  findAllAffiliations(): Promise<dbAccountAffiliation[]>;
  findAllAccountTypes(): Promise<dbAccountTypeRecord[]>;
  findAccountByUrls(urls: string[]): Promise<dbAccount | null>;
  findAccountsWithRelations(accountIds?: bigint[]): Promise<dbAccount[]>;
  findAccountWithRelationsById(accountId: bigint): Promise<dbAccount | null>;
  findAccountUrls(accountId: bigint): Promise<dbAccountUrl[]>;
  findAccountUrlById(accountId: bigint, urlId: bigint): Promise<dbAccountUrl | null>;
  findAccountUrlByValue(
    accountId: bigint,
    url: string,
    excludeUrlId?: bigint,
  ): Promise<dbAccountUrl | null>;
  createAccountUrl(accountId: bigint, url: string): Promise<dbAccountUrl>;
  updateAccountUrl(urlId: bigint, url: string): Promise<dbAccountUrl>;
  deleteAccountUrl(urlId: bigint): Promise<void>;
}
