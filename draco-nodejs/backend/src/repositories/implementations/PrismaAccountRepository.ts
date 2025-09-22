import { Prisma, PrismaClient, accounts } from '@prisma/client';
import { IAccountRepository } from '../interfaces/index.js';
import { dbAccountAffiliation, dbAccount } from '../types/index.js';

export class PrismaAccountRepository implements IAccountRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: bigint): Promise<accounts | null> {
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

  async update(id: bigint, data: Partial<accounts>): Promise<accounts> {
    return this.prisma.accounts.update({
      where: { id: BigInt(id) },
      data,
    });
  }

  async delete(id: bigint): Promise<accounts> {
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

  async searchByTerm(searchTerm: string, limit = 20): Promise<dbAccount[]> {
    return this.prisma.accounts.findMany({
      where: {
        OR: [
          {
            name: {
              contains: searchTerm,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            accounttypes: {
              name: {
                contains: searchTerm,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
        ],
      },
      include: {
        accountsurl: true,
        accounttypes: true,
      },
      orderBy: {
        name: Prisma.SortOrder.asc,
      },
      take: limit,
    });
  }

  async findAffiliationsByIds(ids: bigint[]): Promise<dbAccountAffiliation[]> {
    if (!ids.length) {
      return [];
    }

    return this.prisma.affiliations.findMany({
      where: {
        id: { in: ids },
      },
      select: {
        id: true,
        name: true,
        url: true,
      },
    });
  }
}
