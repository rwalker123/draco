import { PrismaClient, leaguefaq } from '#prisma/client';
import { ILeagueFaqRepository } from '../interfaces/ILeagueFaqRepository.js';
import { dbLeagueFaq } from '../types/index.js';

export class PrismaLeagueFaqRepository implements ILeagueFaqRepository {
  private readonly select = {
    id: true,
    accountid: true,
    question: true,
    answer: true,
  } as const;

  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: bigint): Promise<leaguefaq | null> {
    return this.prisma.leaguefaq.findUnique({ where: { id } });
  }

  async findByIdForAccount(faqId: bigint, accountId: bigint): Promise<dbLeagueFaq | null> {
    return this.prisma.leaguefaq.findFirst({
      where: {
        id: faqId,
        accountid: accountId,
      },
      select: this.select,
    });
  }

  async findMany(where?: Record<string, unknown>): Promise<leaguefaq[]> {
    return this.prisma.leaguefaq.findMany({ where });
  }

  async listByAccount(accountId: bigint): Promise<dbLeagueFaq[]> {
    return this.prisma.leaguefaq.findMany({
      where: { accountid: accountId },
      select: this.select,
      orderBy: [{ question: 'asc' }, { id: 'asc' }],
    });
  }

  async create(data: Partial<leaguefaq>): Promise<leaguefaq> {
    return this.prisma.leaguefaq.create({
      data: data as Parameters<typeof this.prisma.leaguefaq.create>[0]['data'],
    });
  }

  async update(id: bigint, data: Partial<leaguefaq>): Promise<leaguefaq> {
    return this.prisma.leaguefaq.update({
      where: { id },
      data,
    });
  }

  async delete(id: bigint): Promise<leaguefaq> {
    return this.prisma.leaguefaq.delete({ where: { id } });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.leaguefaq.count({ where });
  }
}
