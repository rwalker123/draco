import { accountfacebookcredentials } from '#prisma/client';
import { IBaseRepository } from './IBaseRepository.js';

export interface IAccountFacebookCredentialsRepository
  extends IBaseRepository<accountfacebookcredentials> {
  findByAccountId(accountId: bigint): Promise<accountfacebookcredentials | null>;
  upsertForAccount(
    accountId: bigint,
    data: Partial<accountfacebookcredentials>,
  ): Promise<accountfacebookcredentials>;
  deleteByAccountId(accountId: bigint): Promise<void>;
}
