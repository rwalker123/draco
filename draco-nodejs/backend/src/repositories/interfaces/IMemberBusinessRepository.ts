import { memberbusiness } from '@prisma/client';
import { IBaseRepository } from './IBaseRepository.js';
import { dbMemberBusiness } from '../types/index.js';

export interface IMemberBusinessRepository extends IBaseRepository<memberbusiness> {
  listByAccount(accountId: bigint, contactId?: bigint): Promise<dbMemberBusiness[]>;
  findByIdForAccount(memberBusinessId: bigint, accountId: bigint): Promise<dbMemberBusiness | null>;
}
