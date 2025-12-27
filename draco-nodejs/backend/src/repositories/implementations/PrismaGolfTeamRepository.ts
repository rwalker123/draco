import { PrismaClient, teamsseason, teams } from '#prisma/client';
import {
  IGolfTeamRepository,
  GolfTeamWithFlight,
  GolfTeamWithRoster,
} from '../interfaces/IGolfTeamRepository.js';

export class PrismaGolfTeamRepository implements IGolfTeamRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findBySeasonId(seasonId: bigint): Promise<GolfTeamWithFlight[]> {
    return this.prisma.teamsseason.findMany({
      where: { leagueseasonid: seasonId },
      include: {
        divisionseason: {
          include: {
            divisiondefs: {
              select: { id: true, name: true },
            },
          },
        },
        teams: true,
        _count: {
          select: { golfroster: true },
        },
      },
      orderBy: [{ divisionseason: { priority: 'asc' } }, { name: 'asc' }],
    });
  }

  async findByFlightId(flightId: bigint): Promise<GolfTeamWithFlight[]> {
    return this.prisma.teamsseason.findMany({
      where: { divisionseasonid: flightId },
      include: {
        divisionseason: {
          include: {
            divisiondefs: {
              select: { id: true, name: true },
            },
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
        divisionseason: {
          include: {
            divisiondefs: {
              select: { id: true, name: true },
            },
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
        divisionseason: {
          include: {
            divisiondefs: {
              select: { id: true, name: true },
            },
          },
        },
        teams: true,
        golfroster: {
          where: { isactive: true },
          include: {
            contacts: true,
          },
          orderBy: { contacts: { lastname: 'asc' } },
        },
      },
    });
  }

  async create(
    seasonId: bigint,
    accountId: bigint,
    name: string,
    flightId?: bigint,
  ): Promise<teamsseason> {
    const teamDef = await this.findOrCreateTeamDef(accountId);

    return this.prisma.teamsseason.create({
      data: {
        leagueseasonid: seasonId,
        teamid: teamDef.id,
        name,
        divisionseasonid: flightId ?? null,
      },
    });
  }

  async update(
    teamSeasonId: bigint,
    data: { name?: string; divisionseasonid?: bigint | null },
  ): Promise<teamsseason> {
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

  async assignToFlight(teamSeasonId: bigint, flightId: bigint | null): Promise<teamsseason> {
    return this.prisma.teamsseason.update({
      where: { id: teamSeasonId },
      data: { divisionseasonid: flightId },
    });
  }

  async findOrCreateTeamDef(accountId: bigint): Promise<teams> {
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

  async teamSeasonExists(teamSeasonId: bigint, seasonId: bigint): Promise<boolean> {
    const count = await this.prisma.teamsseason.count({
      where: {
        id: teamSeasonId,
        leagueseason: {
          seasonid: seasonId,
        },
      },
    });
    return count > 0;
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
