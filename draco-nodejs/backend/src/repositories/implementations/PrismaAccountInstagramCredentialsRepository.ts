import { PrismaClient, accountinstagramcredentials } from '#prisma/client';
import { IAccountInstagramCredentialsRepository } from '../interfaces/IAccountInstagramCredentialsRepository.js';

export class PrismaAccountInstagramCredentialsRepository
  implements IAccountInstagramCredentialsRepository
{
  constructor(private prisma: PrismaClient) {}

  findById(id: bigint): Promise<accountinstagramcredentials | null> {
    return this.prisma.accountinstagramcredentials.findUnique({
      where: { id: BigInt(id) },
    });
  }

  findByAccountId(accountId: bigint): Promise<accountinstagramcredentials | null> {
    return this.prisma.accountinstagramcredentials.findUnique({
      where: { accountid: BigInt(accountId) },
    });
  }

  findMany(where?: Record<string, unknown>): Promise<accountinstagramcredentials[]> {
    return this.prisma.accountinstagramcredentials.findMany({ where });
  }

  create(data: Partial<accountinstagramcredentials>): Promise<accountinstagramcredentials> {
    return this.prisma.accountinstagramcredentials.create({
      data: data as Parameters<typeof this.prisma.accountinstagramcredentials.create>[0]['data'],
    });
  }

  update(
    id: bigint,
    data: Partial<accountinstagramcredentials>,
  ): Promise<accountinstagramcredentials> {
    return this.prisma.accountinstagramcredentials.update({
      where: { id: BigInt(id) },
      data,
    });
  }

  delete(id: bigint): Promise<accountinstagramcredentials> {
    return this.prisma.accountinstagramcredentials.delete({
      where: { id: BigInt(id) },
    });
  }

  count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.accountinstagramcredentials.count({ where });
  }

  async upsertForAccount(
    accountId: bigint,
    data: Partial<accountinstagramcredentials>,
  ): Promise<accountinstagramcredentials> {
    const existing = await this.findByAccountId(accountId);
    if (existing) {
      return this.update(existing.id, data);
    }

    return this.create({
      ...data,
      accountid: BigInt(accountId),
    });
  }

  findAllConfigured(): Promise<accountinstagramcredentials[]> {
    return this.prisma.accountinstagramcredentials.findMany({
      where: {
        accesstoken: { not: null },
        instagramuserid: { not: null },
      },
    });
  }
}
