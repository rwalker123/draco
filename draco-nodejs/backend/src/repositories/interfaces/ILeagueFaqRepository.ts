import { leaguefaq } from '#prisma/client';
import { IBaseRepository } from './IBaseRepository.js';
import { dbLeagueFaq } from '../types/index.js';

export interface ILeagueFaqRepository extends IBaseRepository<leaguefaq> {
  listByAccount(accountId: bigint): Promise<dbLeagueFaq[]>;
  findByIdForAccount(faqId: bigint, accountId: bigint): Promise<dbLeagueFaq | null>;
}
