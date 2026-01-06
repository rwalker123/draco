import { PrismaClient, teamsseason } from '#prisma/client';
import {
  IGolfTeamRepository,
  GolfTeamWithFlight,
  GolfTeamWithRoster,
} from '../interfaces/IGolfTeamRepository.js';

export class PrismaGolfTeamRepository implements IGolfTeamRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findBySeasonId(seasonId: bigint): Promise<GolfTeamWithFlight[]> {
    return this.prisma.teamsseason.findMany({
      where: {
        leagueseason: {
          seasonid: seasonId,
          golfseasonconfig: {
            isNot: null,
          },
        },
      },
      include: {
        leagueseason: {
          include: {
            league: true,
          },
        },
        teams: true,
        _count: {
          select: { golfroster: true },
        },
      },
      orderBy: [{ leagueseason: { league: { name: 'asc' } } }, { name: 'asc' }],
    });
  }

  async findByFlightId(flightId: bigint): Promise<GolfTeamWithFlight[]> {
    return this.prisma.teamsseason.findMany({
      where: { leagueseasonid: flightId },
      include: {
        leagueseason: {
          include: {
            league: true,
          },
        },
        teams: true,
        _count: {
          select: { golfroster: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(teamSeasonId: bigint): Promise<GolfTeamWithFlight | null> {
    return this.prisma.teamsseason.findUnique({
      where: { id: teamSeasonId },
      include: {
        leagueseason: {
          include: {
            league: true,
          },
        },
        teams: true,
        _count: {
          select: { golfroster: true },
        },
      },
    });
  }

  async findByIdWithRoster(teamSeasonId: bigint): Promise<GolfTeamWithRoster | null> {
    return this.prisma.teamsseason.findUnique({
      where: { id: teamSeasonId },
      include: {
        leagueseason: {
          include: {
            league: true,
          },
        },
        teams: true,
        golfroster: {
          where: { isactive: true },
          include: {
            golfer: {
              include: {
                contact: true,
              },
            },
          },
          orderBy: { golfer: { contact: { lastname: 'asc' } } },
        },
      },
    });
  }

  async create(flightId: bigint, name: string): Promise<teamsseason> {
    const leagueseason = await this.prisma.leagueseason.findUnique({
      where: { id: flightId },
      include: {
        season: true,
      },
    });

    if (!leagueseason) {
      throw new Error('Flight not found');
    }

    const teamDef = await this.findOrCreateTeamDef(leagueseason.season.accountid);

    return this.prisma.teamsseason.create({
      data: {
        leagueseasonid: flightId,
        teamid: teamDef.id,
        name,
      },
    });
  }

  private async findOrCreateTeamDef(accountId: bigint) {
    const existing = await this.prisma.teams.findFirst({
      where: { accountid: accountId },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.teams.create({
      data: {
        accountid: accountId,
        webaddress: '',
      },
    });
  }

  async update(teamSeasonId: bigint, data: { name?: string }): Promise<teamsseason> {
    return this.prisma.teamsseason.update({
      where: { id: teamSeasonId },
      data,
    });
  }

  async delete(teamSeasonId: bigint): Promise<teamsseason> {
    return this.prisma.teamsseason.delete({
      where: { id: teamSeasonId },
    });
  }

  async hasMatches(teamSeasonId: bigint): Promise<boolean> {
    const count = await this.prisma.golfmatch.count({
      where: {
        OR: [{ team1: teamSeasonId }, { team2: teamSeasonId }],
      },
    });
    return count > 0;
  }
}
