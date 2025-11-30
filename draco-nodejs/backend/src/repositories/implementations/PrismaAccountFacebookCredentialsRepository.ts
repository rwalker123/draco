import { PrismaClient, accountfacebookcredentials } from '#prisma/client';
import { IAccountFacebookCredentialsRepository } from '../interfaces/IAccountFacebookCredentialsRepository.js';

export class PrismaAccountFacebookCredentialsRepository
  implements IAccountFacebookCredentialsRepository
{
  constructor(private prisma: PrismaClient) {}

  findById(id: bigint): Promise<accountfacebookcredentials | null> {
    return this.prisma.accountfacebookcredentials.findUnique({
      where: { id: BigInt(id) },
    });
  }

  findByAccountId(accountId: bigint): Promise<accountfacebookcredentials | null> {
    return this.prisma.accountfacebookcredentials.findUnique({
      where: { accountid: BigInt(accountId) },
    });
  }

  findMany(where?: Record<string, unknown>): Promise<accountfacebookcredentials[]> {
    return this.prisma.accountfacebookcredentials.findMany({ where });
  }

  create(data: Partial<accountfacebookcredentials>): Promise<accountfacebookcredentials> {
    return this.prisma.accountfacebookcredentials.create({
      data: data as Parameters<typeof this.prisma.accountfacebookcredentials.create>[0]['data'],
    });
  }

  update(
    id: bigint,
    data: Partial<accountfacebookcredentials>,
  ): Promise<accountfacebookcredentials> {
    return this.prisma.accountfacebookcredentials.update({
      where: { id: BigInt(id) },
      data,
    });
  }

  delete(id: bigint): Promise<accountfacebookcredentials> {
    return this.prisma.accountfacebookcredentials.delete({
      where: { id: BigInt(id) },
    });
  }

  async deleteByAccountId(accountId: bigint): Promise<void> {
    await this.prisma.accountfacebookcredentials.deleteMany({
      where: { accountid: BigInt(accountId) },
    });
  }

  count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.accountfacebookcredentials.count({ where });
  }

  async upsertForAccount(
    accountId: bigint,
    data: Partial<accountfacebookcredentials>,
  ): Promise<accountfacebookcredentials> {
    const existing = await this.findByAccountId(accountId);
    if (existing) {
      return this.update(existing.id, data);
    }

    return this.create({
      ...data,
      accountid: BigInt(accountId),
    });
  }
}
