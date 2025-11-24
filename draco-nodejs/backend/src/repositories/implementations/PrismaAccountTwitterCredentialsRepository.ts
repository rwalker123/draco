import { PrismaClient, accounttwittercredentials } from '#prisma/client';
import { IAccountTwitterCredentialsRepository } from '../interfaces/IAccountTwitterCredentialsRepository.js';

export class PrismaAccountTwitterCredentialsRepository
  implements IAccountTwitterCredentialsRepository
{
  constructor(private prisma: PrismaClient) {}

  findById(id: bigint): Promise<accounttwittercredentials | null> {
    return this.prisma.accounttwittercredentials.findUnique({
      where: { id: BigInt(id) },
    });
  }

  findByAccountId(accountId: bigint): Promise<accounttwittercredentials | null> {
    return this.prisma.accounttwittercredentials.findUnique({
      where: { accountid: BigInt(accountId) },
    });
  }

  findMany(where?: Record<string, unknown>): Promise<accounttwittercredentials[]> {
    return this.prisma.accounttwittercredentials.findMany({ where });
  }

  create(data: Partial<accounttwittercredentials>): Promise<accounttwittercredentials> {
    return this.prisma.accounttwittercredentials.create({
      data: data as Parameters<typeof this.prisma.accounttwittercredentials.create>[0]['data'],
    });
  }

  update(id: bigint, data: Partial<accounttwittercredentials>): Promise<accounttwittercredentials> {
    return this.prisma.accounttwittercredentials.update({
      where: { id: BigInt(id) },
      data,
    });
  }

  delete(id: bigint): Promise<accounttwittercredentials> {
    return this.prisma.accounttwittercredentials.delete({
      where: { id: BigInt(id) },
    });
  }

  count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.accounttwittercredentials.count({ where });
  }

  async upsertForAccount(
    accountId: bigint,
    data: Partial<accounttwittercredentials>,
  ): Promise<accounttwittercredentials> {
    const existing = await this.findByAccountId(accountId);
    if (existing) {
      return this.update(existing.id, data);
    }

    return this.create({
      ...data,
      accountid: BigInt(accountId),
    });
  }

  findAllWithIngestionToken(): Promise<accounttwittercredentials[]> {
    return this.prisma.accounttwittercredentials.findMany({
      where: {
        ingestionbearertoken: {
          not: null,
        },
        handle: {
          not: null,
          notIn: [''],
        },
      },
    });
  }
}
