import { PrismaClient, accounts } from '@prisma/client';
import { IAccountRepository } from '../interfaces/IAccountRepository';

export class PrismaAccountRepository implements IAccountRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string | number): Promise<accounts | null> {
    return this.prisma.accounts.findUnique({
      where: { id: BigInt(id) },
    });
  }

  async findMany(where?: Record<string, unknown>): Promise<accounts[]> {
    return this.prisma.accounts.findMany({ where });
  }

  async create(data: Partial<accounts>): Promise<accounts> {
    return this.prisma.accounts.create({
      data: data as Parameters<typeof this.prisma.accounts.create>[0]['data'],
    });
  }

  async update(id: string | number, data: Partial<accounts>): Promise<accounts> {
    return this.prisma.accounts.update({
      where: { id: BigInt(id) },
      data,
    });
  }

  async delete(id: string | number): Promise<accounts> {
    return this.prisma.accounts.delete({
      where: { id: BigInt(id) },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.accounts.count({ where });
  }

  async findByDomain(domain: string): Promise<accounts | null> {
    const accountUrl = await this.prisma.accountsurl.findFirst({
      where: {
        url: domain,
      },
      include: {
        accounts: true,
      },
    });
    return accountUrl?.accounts || null;
  }

  async findBySubdomain(subdomain: string): Promise<accounts | null> {
    const accountUrl = await this.prisma.accountsurl.findFirst({
      where: {
        url: subdomain,
      },
      include: {
        accounts: true,
      },
    });
    return accountUrl?.accounts || null;
  }
}
