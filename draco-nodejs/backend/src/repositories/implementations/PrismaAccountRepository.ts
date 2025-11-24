import { Prisma, PrismaClient, accounts } from '#prisma/client';
import { IAccountRepository } from '../interfaces/index.js';
import {
  dbAccountAffiliation,
  dbAccount,
  dbAccountTypeRecord,
  dbAccountUrl,
} from '../types/index.js';

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

  async findAccountByUrls(urls: string[]): Promise<dbAccount | null> {
    if (!urls.length) {
      return null;
    }

    return this.prisma.accounts.findFirst({
      where: {
        accountsurl: {
          some: {
            url: {
              in: urls,
            },
          },
        },
      },
      include: {
        accountsurl: true,
        accounttypes: true,
        accounttwittercredentials: true,
      },
    });
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
        accounttwittercredentials: true,
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

  async findAccountsWithRelations(accountIds?: bigint[]): Promise<dbAccount[]> {
    const whereClause = accountIds && accountIds.length ? { id: { in: accountIds } } : undefined;

    return this.prisma.accounts.findMany({
      where: whereClause,
      include: {
        accounttypes: true,
        accountsurl: {
          orderBy: {
            id: Prisma.SortOrder.asc,
          },
        },
        accounttwittercredentials: true,
      },
      orderBy: {
        name: Prisma.SortOrder.asc,
      },
    });
  }

  async findAccountWithRelationsById(accountId: bigint): Promise<dbAccount | null> {
    return this.prisma.accounts.findUnique({
      where: { id: accountId },
      include: {
        accounttypes: true,
        accountsurl: {
          orderBy: {
            id: Prisma.SortOrder.asc,
          },
        },
        accounttwittercredentials: true,
      },
    });
  }

  async findAllAffiliations(): Promise<dbAccountAffiliation[]> {
    return this.prisma.affiliations.findMany({
      select: {
        id: true,
        name: true,
        url: true,
      },
      orderBy: {
        name: Prisma.SortOrder.asc,
      },
    });
  }

  async findAllAccountTypes(): Promise<dbAccountTypeRecord[]> {
    return this.prisma.accounttypes.findMany({
      select: {
        id: true,
        name: true,
        filepath: true,
      },
      orderBy: {
        name: Prisma.SortOrder.asc,
      },
    });
  }

  async findAccountUrls(accountId: bigint): Promise<dbAccountUrl[]> {
    return this.prisma.accountsurl.findMany({
      where: {
        accountid: BigInt(accountId),
      },
      select: {
        id: true,
        accountid: true,
        url: true,
      },
      orderBy: {
        id: Prisma.SortOrder.asc,
      },
    });
  }

  async findAccountUrlById(accountId: bigint, urlId: bigint): Promise<dbAccountUrl | null> {
    return this.prisma.accountsurl.findFirst({
      where: {
        id: BigInt(urlId),
        accountid: BigInt(accountId),
      },
      select: {
        id: true,
        accountid: true,
        url: true,
      },
    });
  }

  async findAccountUrlByValue(
    accountId: bigint,
    url: string,
    excludeUrlId?: bigint,
  ): Promise<dbAccountUrl | null> {
    return this.prisma.accountsurl.findFirst({
      where: {
        accountid: BigInt(accountId),
        url,
        ...(excludeUrlId
          ? {
              id: {
                not: BigInt(excludeUrlId),
              },
            }
          : {}),
      },
      select: {
        id: true,
        accountid: true,
        url: true,
      },
    });
  }

  async createAccountUrl(accountId: bigint, url: string): Promise<dbAccountUrl> {
    return this.prisma.accountsurl.create({
      data: {
        accountid: BigInt(accountId),
        url,
      },
      select: {
        id: true,
        accountid: true,
        url: true,
      },
    });
  }

  async updateAccountUrl(urlId: bigint, url: string): Promise<dbAccountUrl> {
    return this.prisma.accountsurl.update({
      where: { id: BigInt(urlId) },
      data: { url },
      select: {
        id: true,
        accountid: true,
        url: true,
      },
    });
  }

  async deleteAccountUrl(urlId: bigint): Promise<void> {
    await this.prisma.accountsurl.delete({
      where: { id: BigInt(urlId) },
    });
  }
}
