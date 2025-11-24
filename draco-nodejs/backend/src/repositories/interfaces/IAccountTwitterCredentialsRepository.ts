import { accounttwittercredentials } from '#prisma/client';
import { IBaseRepository } from './IBaseRepository.js';

export interface IAccountTwitterCredentialsRepository
  extends IBaseRepository<accounttwittercredentials> {
  findByAccountId(accountId: bigint): Promise<accounttwittercredentials | null>;
  upsertForAccount(
    accountId: bigint,
    data: Partial<accounttwittercredentials>,
  ): Promise<accounttwittercredentials>;
  findAllWithIngestionToken(): Promise<accounttwittercredentials[]>;
}
