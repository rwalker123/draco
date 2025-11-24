import { PrismaClient, accountblueskycredentials } from '#prisma/client';
import { IAccountBlueskyCredentialsRepository } from '../interfaces/IAccountBlueskyCredentialsRepository.js';

export class PrismaAccountBlueskyCredentialsRepository
  implements IAccountBlueskyCredentialsRepository
{
  constructor(private prisma: PrismaClient) {}

  findById(id: bigint): Promise<accountblueskycredentials | null> {
    return this.prisma.accountblueskycredentials.findUnique({
      where: { id: BigInt(id) },
    });
  }

  findByAccountId(accountId: bigint): Promise<accountblueskycredentials | null> {
    return this.prisma.accountblueskycredentials.findUnique({
      where: { accountid: BigInt(accountId) },
    });
  }

  findMany(where?: Record<string, unknown>): Promise<accountblueskycredentials[]> {
    return this.prisma.accountblueskycredentials.findMany({ where });
  }

  create(data: Partial<accountblueskycredentials>): Promise<accountblueskycredentials> {
    return this.prisma.accountblueskycredentials.create({
      data: data as Parameters<typeof this.prisma.accountblueskycredentials.create>[0]['data'],
    });
  }

  update(id: bigint, data: Partial<accountblueskycredentials>): Promise<accountblueskycredentials> {
    return this.prisma.accountblueskycredentials.update({
      where: { id: BigInt(id) },
      data,
    });
  }

  delete(id: bigint): Promise<accountblueskycredentials> {
    return this.prisma.accountblueskycredentials.delete({
      where: { id: BigInt(id) },
    });
  }

  count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.accounttwittercredentials.count({ where });
  }

  async upsertForAccount(
    accountId: bigint,
    data: Partial<accountblueskycredentials>,
  ): Promise<accountblueskycredentials> {
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
