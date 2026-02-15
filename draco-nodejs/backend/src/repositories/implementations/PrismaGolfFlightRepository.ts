import { PrismaClient } from '#prisma/client';
import {
  IGolfFlightRepository,
  GolfFlightWithDetails,
  GolfFlightWithCounts,
} from '../interfaces/IGolfFlightRepository.js';

export class PrismaGolfFlightRepository implements IGolfFlightRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findBySeasonId(seasonId: bigint): Promise<GolfFlightWithCounts[]> {
    const flights = await this.prisma.leagueseason.findMany({
      where: {
        seasonid: seasonId,
        golfseasonconfig: {
          isNot: null,
        },
      },
      include: {
        league: true,
        season: true,
        _count: {
          select: { teamsseason: true },
        },
      },
      orderBy: { league: { name: 'asc' } },
    });

    const flightIds = flights.map((f) => f.id);
    const playerCountMap = await this.getPlayerCountsForFlights(flightIds);

    return flights.map((flight) => ({
      ...flight,
      teamCount: flight._count.teamsseason,
      playerCount: playerCountMap.get(flight.id) ?? 0,
    }));
  }

  async findById(flightId: bigint): Promise<GolfFlightWithDetails | null> {
    return this.prisma.leagueseason.findUnique({
      where: { id: flightId },
      include: {
        league: true,
        season: true,
      },
    });
  }

  async create(accountId: bigint, seasonId: bigint, name: string): Promise<GolfFlightWithDetails> {
    const league = await this.prisma.league.create({
      data: {
        accountid: accountId,
        name,
      },
    });

    const leagueSeason = await this.prisma.leagueseason.create({
      data: {
        leagueid: league.id,
        seasonid: seasonId,
      },
      include: {
        league: true,
        season: true,
      },
    });

    await this.prisma.golfseasonconfig.create({
      data: {
        leagueseasonid: leagueSeason.id,
        teamsize: 2,
      },
    });

    return leagueSeason;
  }

  async update(flightId: bigint, name: string): Promise<GolfFlightWithDetails> {
    const flight = await this.prisma.leagueseason.findUnique({
      where: { id: flightId },
      include: { league: true },
    });

    if (!flight) {
      throw new Error('Flight not found');
    }

    await this.prisma.league.update({
      where: { id: flight.leagueid },
      data: { name },
    });

    return this.prisma.leagueseason.findUniqueOrThrow({
      where: { id: flightId },
      include: {
        league: true,
        season: true,
      },
    });
  }

  async delete(flightId: bigint): Promise<void> {
    const flight = await this.prisma.leagueseason.findUnique({
      where: { id: flightId },
      select: { leagueid: true },
    });

    if (!flight) {
      return;
    }

    await this.prisma.leagueseason.delete({
      where: { id: flightId },
    });

    const otherSeasons = await this.prisma.leagueseason.count({
      where: { leagueid: flight.leagueid },
    });

    if (otherSeasons === 0) {
      await this.prisma.league.delete({
        where: { id: flight.leagueid },
      });
    }
  }

  async getPlayerCountForFlight(flightId: bigint): Promise<number> {
    const count = await this.prisma.golfroster.count({
      where: {
        teamsseason: {
          leagueseasonid: flightId,
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
        leagueseasonid: { in: flightIds },
      },
      select: {
        leagueseasonid: true,
        _count: {
          select: { golfroster: { where: { isactive: true } } },
        },
      },
    });

    const countMap = new Map<bigint, number>();
    for (const item of counts) {
      const flightId = item.leagueseasonid;
      const currentCount = countMap.get(flightId) ?? 0;
      countMap.set(flightId, currentCount + item._count.golfroster);
    }

    return countMap;
  }

  async flightNameExistsInSeason(
    accountId: bigint,
    seasonId: bigint,
    name: string,
  ): Promise<boolean> {
    const count = await this.prisma.leagueseason.count({
      where: {
        seasonid: seasonId,
        league: {
          accountid: accountId,
          name: {
            equals: name,
            mode: 'insensitive',
          },
        },
      },
    });
    return count > 0;
  }

  async seasonHasFlights(seasonId: bigint): Promise<boolean> {
    const count = await this.prisma.leagueseason.count({
      where: {
        seasonid: seasonId,
        golfseasonconfig: {
          isNot: null,
        },
      },
    });
    return count > 0;
  }

  async findByLeagueAndSeason(leagueId: bigint, seasonId: bigint): Promise<{ id: bigint } | null> {
    return this.prisma.leagueseason.findFirst({
      where: {
        leagueid: leagueId,
        seasonid: seasonId,
      },
      select: { id: true },
    });
  }
}
