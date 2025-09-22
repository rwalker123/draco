import { accounts } from '@prisma/client';
import { IBaseRepository } from './IBaseRepository.js';
import { dbAccountAffiliation, dbAccount } from '../types/index.js';

export interface IAccountRepository extends IBaseRepository<accounts> {
  findByDomain(domain: string): Promise<accounts | null>;
  findBySubdomain(subdomain: string): Promise<accounts | null>;
  searchByTerm(searchTerm: string, limit?: number): Promise<dbAccount[]>;
  findAffiliationsByIds(ids: bigint[]): Promise<dbAccountAffiliation[]>;
  findAccountByUrls(urls: string[]): Promise<dbAccount | null>;
}
