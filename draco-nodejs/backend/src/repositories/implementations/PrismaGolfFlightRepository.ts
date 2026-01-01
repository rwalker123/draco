import { PrismaClient, divisionseason, divisiondefs } from '#prisma/client';
import {
  IGolfFlightRepository,
  GolfFlightWithDetails,
  GolfFlightWithCounts,
  LeagueSeasonWithSeason,
} from '../interfaces/IGolfFlightRepository.js';

export class PrismaGolfFlightRepository implements IGolfFlightRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findBySeasonId(seasonId: bigint): Promise<GolfFlightWithCounts[]> {
    const flights = await this.prisma.divisionseason.findMany({
      where: {
        leagueseason: {
          seasonid: seasonId,
        },
      },
      include: {
        divisiondefs: true,
        leagueseason: {
          include: {
            season: true,
          },
        },
        _count: {
          select: { teamsseason: true },
        },
      },
      orderBy: { priority: 'asc' },
    });

    const flightIds = flights.map((f) => f.id);
    const playerCountMap = await this.getPlayerCountsForFlights(flightIds);

    return flights.map((flight) => ({
      ...flight,
      playerCount: playerCountMap.get(flight.id) ?? 0,
    }));
  }

  async findByLeagueSeasonId(leagueSeasonId: bigint): Promise<GolfFlightWithCounts[]> {
    const flights = await this.prisma.divisionseason.findMany({
      where: { leagueseasonid: leagueSeasonId },
      include: {
        divisiondefs: true,
        leagueseason: {
          include: {
            season: true,
          },
        },
        _count: {
          select: { teamsseason: true },
        },
      },
      orderBy: { priority: 'asc' },
    });

    const flightIds = flights.map((f) => f.id);
    const playerCountMap = await this.getPlayerCountsForFlights(flightIds);

    return flights.map((flight) => ({
      ...flight,
      playerCount: playerCountMap.get(flight.id) ?? 0,
    }));
  }

  async findById(flightId: bigint): Promise<GolfFlightWithDetails | null> {
    return this.prisma.divisionseason.findUnique({
      where: { id: flightId },
      include: {
        divisiondefs: true,
        leagueseason: {
          include: {
            season: true,
          },
        },
      },
    });
  }

  async create(leagueSeasonId: bigint, divisionId: bigint, priority = 0): Promise<divisionseason> {
    return this.prisma.divisionseason.create({
      data: {
        leagueseasonid: leagueSeasonId,
        divisionid: divisionId,
        priority,
      },
    });
  }

  async update(flightId: bigint, data: Partial<divisionseason>): Promise<divisionseason> {
    return this.prisma.divisionseason.update({
      where: { id: flightId },
      data,
    });
  }

  async delete(flightId: bigint): Promise<divisionseason> {
    return this.prisma.divisionseason.delete({
      where: { id: flightId },
    });
  }

  async findOrCreateDivision(accountId: bigint, name: string): Promise<divisiondefs> {
    const existing = await this.prisma.divisiondefs.findFirst({
      where: {
        accountid: accountId,
        name,
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.divisiondefs.create({
      data: {
        accountid: accountId,
        name,
      },
    });
  }

  async getPlayerCountForFlight(flightId: bigint): Promise<number> {
    const count = await this.prisma.rosterseason.count({
      where: {
        teamsseason: {
          divisionseasonid: flightId,
        },
      },
    });

    return count;
  }

  private async getPlayerCountsForFlights(flightIds: bigint[]): Promise<Map<bigint, number>> {
    if (flightIds.length === 0) {
      return new Map();
    }

    const counts = await this.prisma.teamsseason.findMany({
      where: {
        divisionseasonid: { in: flightIds },
      },
      select: {
        divisionseasonid: true,
        _count: {
          select: { rosterseason: true },
        },
      },
    });

    const countMap = new Map<bigint, number>();
    for (const item of counts) {
      const flightId = item.divisionseasonid;
      if (flightId === null) continue;
      const currentCount = countMap.get(flightId) ?? 0;
      countMap.set(flightId, currentCount + item._count.rosterseason);
    }

    return countMap;
  }

  async getLeagueSeasonWithHierarchy(
    leagueSeasonId: bigint,
  ): Promise<LeagueSeasonWithSeason | null> {
    return this.prisma.leagueseason.findUnique({
      where: { id: leagueSeasonId },
      include: {
        season: true,
      },
    });
  }

  async leagueSeasonExists(leagueSeasonId: bigint): Promise<boolean> {
    const count = await this.prisma.leagueseason.count({
      where: { id: leagueSeasonId },
    });
    return count > 0;
  }
}
