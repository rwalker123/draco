import { PrismaClient, divisionseason, divisiondefs } from '#prisma/client';
import {
  IGolfFlightRepository,
  GolfFlightWithDetails,
  GolfFlightWithCounts,
} from '../interfaces/IGolfFlightRepository.js';

export class PrismaGolfFlightRepository implements IGolfFlightRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findBySeasonId(seasonId: bigint): Promise<GolfFlightWithCounts[]> {
    const flights = await this.prisma.divisionseason.findMany({
      where: { leagueseasonid: seasonId },
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

    const flightsWithPlayerCount = await Promise.all(
      flights.map(async (flight) => ({
        ...flight,
        playerCount: await this.getPlayerCountForFlight(flight.id),
      })),
    );

    return flightsWithPlayerCount;
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

  async create(seasonId: bigint, divisionId: bigint, priority = 0): Promise<divisionseason> {
    return this.prisma.divisionseason.create({
      data: {
        leagueseasonid: seasonId,
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

  async leagueSeasonExists(seasonId: bigint): Promise<boolean> {
    const count = await this.prisma.leagueseason.count({
      where: { id: seasonId },
    });
    return count > 0;
  }
}
