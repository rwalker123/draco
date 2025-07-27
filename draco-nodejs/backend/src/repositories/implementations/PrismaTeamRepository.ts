import { PrismaClient, teamsseason, teams, leagueseason, divisionseason } from '@prisma/client';
import { ITeamRepository } from '../interfaces/ITeamRepository';

export class PrismaTeamRepository implements ITeamRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string | number): Promise<teamsseason | null> {
    return this.prisma.teamsseason.findUnique({
      where: { id: Number(id) },
    });
  }

  async findMany(where?: Record<string, unknown>): Promise<teamsseason[]> {
    return this.prisma.teamsseason.findMany({ where });
  }

  async create(data: Partial<teamsseason>): Promise<teamsseason> {
    return this.prisma.teamsseason.create({
      data: data as Parameters<typeof this.prisma.teamsseason.create>[0]['data'],
    });
  }

  async update(id: string | number, data: Partial<teamsseason>): Promise<teamsseason> {
    return this.prisma.teamsseason.update({
      where: { id: Number(id) },
      data,
    });
  }

  async delete(id: string | number): Promise<teamsseason> {
    return this.prisma.teamsseason.delete({
      where: { id: Number(id) },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.teamsseason.count({ where });
  }

  async findBySeasonId(seasonId: bigint, accountId: bigint): Promise<teamsseason[]> {
    return this.prisma.teamsseason.findMany({
      where: {
        leagueseason: {
          seasonid: seasonId,
          season: {
            accountid: accountId,
          },
        },
      },
      include: {
        teams: true,
        leagueseason: {
          include: {
            league: true,
            divisionseason: true,
          },
        },
      },
    });
  }

  async findTeamSeasonWithLeague(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<{
    id: number;
    teamname: string;
    leagueseason: leagueseason & {
      leagues: { name: string };
      divisionseason: divisionseason[];
    };
  } | null> {
    const result = await this.prisma.teamsseason.findFirst({
      where: {
        id: teamSeasonId,
        leagueseason: {
          seasonid: seasonId,
          season: {
            accountid: accountId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        leagueseason: {
          include: {
            league: true,
            divisionseason: true,
          },
        },
      },
    });

    if (!result) return null;

    return {
      id: Number(result.id),
      teamname: result.name,
      leagueseason: {
        ...result.leagueseason,
        leagues: result.leagueseason.league,
      } as leagueseason & {
        leagues: { name: string };
        divisionseason: divisionseason[];
      },
    };
  }

  async findTeamDefinition(teamId: bigint): Promise<teams | null> {
    return this.prisma.teams.findUnique({
      where: { id: teamId },
    });
  }
}
