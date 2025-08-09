import { accounts } from '@prisma/client';
import { IBaseRepository } from './IBaseRepository.js';

export interface IAccountRepository extends IBaseRepository<accounts> {
  findByDomain(domain: string): Promise<accounts | null>;
  findBySubdomain(subdomain: string): Promise<accounts | null>;
}
