import { leagueseason, PrismaClient } from '@prisma/client';
import { ILeagueRepository } from '../interfaces/index.js';
import { dbLeagueSeason } from '../types/dbTypes.js';

export class PrismaLeagueRepository implements ILeagueRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: bigint): Promise<leagueseason | null> {
    return await this.prisma.leagueseason.findUnique({
      where: { id: id },
    });
  }

  async findMany(where?: Record<string, unknown>): Promise<leagueseason[]> {
    return await this.prisma.leagueseason.findMany({ where });
  }

  async create(data: Partial<leagueseason>): Promise<leagueseason> {
    return await this.prisma.leagueseason.create({
      data: data as Parameters<typeof this.prisma.leagueseason.create>[0]['data'],
    });
  }

  async update(id: bigint, data: Partial<leagueseason>): Promise<leagueseason> {
    return await this.prisma.leagueseason.update({ where: { id: id }, data });
  }

  async delete(id: bigint): Promise<leagueseason> {
    return await this.prisma.leagueseason.delete({ where: { id: id } });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return await this.prisma.leagueseason.count({ where });
  }

  async findLeagueSeason(
    leagueId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbLeagueSeason | null> {
    return await this.prisma.leagueseason.findUnique({
      where: {
        id: leagueId,
        seasonid: seasonId,
        league: {
          accountid: accountId,
        },
      },
      include: {
        league: true,
      },
    });
  }
}
