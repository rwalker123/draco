import { PrismaClient, leagueseason, Prisma } from '@prisma/client';
import { ILeagueRepository } from '../interfaces/index.js';
import {
  dbLeague,
  dbLeagueCreateInput,
  dbLeagueSeason,
  dbLeagueUpdateInput,
} from '../types/dbTypes.js';

const LEAGUE_SELECT = {
  id: true,
  name: true,
  accountid: true,
} as const;

export class PrismaLeagueRepository implements ILeagueRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: bigint): Promise<leagueseason | null> {
    return this.prisma.leagueseason.findUnique({ where: { id } });
  }

  async findMany(where?: Record<string, unknown>): Promise<leagueseason[]> {
    return this.prisma.leagueseason.findMany({
      where: where as Prisma.leagueseasonWhereInput | undefined,
    });
  }

  async create(data: Prisma.leagueseasonCreateInput): Promise<leagueseason> {
    return this.prisma.leagueseason.create({ data });
  }

  async update(id: bigint, data: Prisma.leagueseasonUpdateInput): Promise<leagueseason> {
    return this.prisma.leagueseason.update({ where: { id }, data });
  }

  async delete(id: bigint): Promise<leagueseason> {
    return this.prisma.leagueseason.delete({ where: { id } });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.leagueseason.count({
      where: where as Prisma.leagueseasonWhereInput | undefined,
    });
  }

  async findAccountLeagues(accountId: bigint): Promise<dbLeague[]> {
    return this.prisma.league.findMany({
      where: {
        accountid: accountId,
      },
      select: LEAGUE_SELECT,
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findLeaguesWithSeasons(accountId: bigint): Promise<dbLeague[]> {
    return this.prisma.league.findMany({
      where: {
        accountid: accountId,
        leagueseason: {
          some: {},
        },
      },
      select: LEAGUE_SELECT,
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findLeagueById(accountId: bigint, leagueId: bigint): Promise<dbLeague | null> {
    return this.prisma.league.findFirst({
      where: {
        id: leagueId,
        accountid: accountId,
      },
      select: LEAGUE_SELECT,
    });
  }

  async findLeagueByName(accountId: bigint, name: string): Promise<dbLeague | null> {
    return this.prisma.league.findFirst({
      where: {
        accountid: accountId,
        name,
      },
      select: LEAGUE_SELECT,
    });
  }

  async findLeagueByNameExcludingId(
    accountId: bigint,
    name: string,
    excludeLeagueId: bigint,
  ): Promise<dbLeague | null> {
    return this.prisma.league.findFirst({
      where: {
        accountid: accountId,
        name,
        id: {
          not: excludeLeagueId,
        },
      },
      select: LEAGUE_SELECT,
    });
  }

  async createLeague(data: dbLeagueCreateInput): Promise<dbLeague> {
    return this.prisma.league.create({
      data,
      select: LEAGUE_SELECT,
    });
  }

  async updateLeague(leagueId: bigint, data: dbLeagueUpdateInput): Promise<dbLeague> {
    return this.prisma.league.update({
      where: {
        id: leagueId,
      },
      data,
      select: LEAGUE_SELECT,
    });
  }

  async deleteLeague(leagueId: bigint): Promise<dbLeague> {
    return this.prisma.league.delete({
      where: {
        id: leagueId,
      },
      select: LEAGUE_SELECT,
    });
  }

  async hasLeagueSeasons(leagueId: bigint): Promise<boolean> {
    const seasonCount = await this.prisma.leagueseason.count({
      where: {
        leagueid: leagueId,
      },
    });

    return seasonCount > 0;
  }

  async findLeagueSeason(
    leagueSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<dbLeagueSeason | null> {
    return this.prisma.leagueseason.findFirst({
      where: {
        id: leagueSeasonId,
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
