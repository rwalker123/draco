import { accountblueskycredentials } from '#prisma/client';
import { IBaseRepository } from './IBaseRepository.js';

export interface IAccountBlueskyCredentialsRepository
  extends IBaseRepository<accountblueskycredentials> {
  findByAccountId(accountId: bigint): Promise<accountblueskycredentials | null>;
  upsertForAccount(
    accountId: bigint,
    data: Partial<accountblueskycredentials>,
  ): Promise<accountblueskycredentials>;
}
