import { Prisma, PrismaClient, leagueumpires } from '@prisma/client';
import { IUmpireRepository } from '../interfaces/IUmpireRepository.js';
import { dbLeagueUmpireWithContact } from '../types/dbTypes.js';

export class PrismaUmpireRepository implements IUmpireRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: bigint): Promise<leagueumpires | null> {
    return this.prisma.leagueumpires.findUnique({
      where: { id: Number(id) },
    });
  }

  async findMany(where?: Record<string, unknown>): Promise<leagueumpires[]> {
    return this.prisma.leagueumpires.findMany({ where });
  }

  async create(data: Prisma.leagueumpiresCreateInput): Promise<leagueumpires> {
    return this.prisma.leagueumpires.create({
      data: data as Parameters<typeof this.prisma.leagueumpires.create>[0]['data'],
    });
  }

  async update(id: bigint, data: Prisma.leagueumpiresUpdateInput): Promise<leagueumpires> {
    return this.prisma.leagueumpires.update({
      where: { id: Number(id) },
      data,
    });
  }

  async delete(id: bigint): Promise<leagueumpires> {
    return this.prisma.leagueumpires.delete({
      where: { id: Number(id) },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.leagueumpires.count({ where });
  }

  async findByAccount(
    accountId: bigint,
    options: {
      skip: number;
      take: number;
      orderBy: Prisma.leagueumpiresOrderByWithRelationInput;
    },
  ): Promise<dbLeagueUmpireWithContact[]> {
    return this.prisma.leagueumpires.findMany({
      where: { accountid: accountId },
      include: {
        contacts: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
      },
      orderBy: options.orderBy,
      skip: options.skip,
      take: options.take,
    });
  }

  async countByAccount(accountId: bigint): Promise<number> {
    return this.prisma.leagueumpires.count({
      where: { accountid: accountId },
    });
  }
}
