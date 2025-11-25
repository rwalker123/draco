import { accountinstagramcredentials } from '#prisma/client';
import { IBaseRepository } from './IBaseRepository.js';

export interface IAccountInstagramCredentialsRepository
  extends IBaseRepository<accountinstagramcredentials> {
  findByAccountId(accountId: bigint): Promise<accountinstagramcredentials | null>;
  upsertForAccount(
    accountId: bigint,
    data: Partial<accountinstagramcredentials>,
  ): Promise<accountinstagramcredentials>;
  findAllConfigured(): Promise<accountinstagramcredentials[]>;
}
