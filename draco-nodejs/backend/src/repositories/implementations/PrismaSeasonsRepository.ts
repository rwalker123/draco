import { PrismaClient } from '@prisma/client';
import {
  dbCurrentSeason,
  dbLeagueSeasonBasic,
  dbSeason,
  dbSeasonWithLeagues,
} from '../types/dbTypes.js';
import { ISeasonsRepository } from '../interfaces/ISeasonsRepository.js';

export class PrismaSeasonsRepository implements ISeasonsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAccountSeasons(
    accountId: bigint,
    includeDivisions: boolean,
  ): Promise<dbSeasonWithLeagues[]> {
    const seasons = await this.prisma.season.findMany({
      where: { accountid: accountId },
      select: {
        id: true,
        name: true,
        accountid: true,
        leagueseason: {
          select: {
            id: true,
            leagueid: true,
            league: {
              select: {
                id: true,
                name: true,
              },
            },
            divisionseason: {
              select: {
                id: true,
                priority: true,
                divisiondefs: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'desc' },
    });

    return seasons.map((season) => ({
      ...season,
      leagueseason: season.leagueseason.map((leagueSeason) => ({
        ...leagueSeason,
        divisionseason: includeDivisions ? leagueSeason.divisionseason : undefined,
      })),
    }));
  }

  async findSeasonWithLeagues(
    accountId: bigint,
    seasonId: bigint,
    includeDivisions: boolean,
  ): Promise<dbSeasonWithLeagues | null> {
    const season = await this.prisma.season.findFirst({
      where: { id: seasonId, accountid: accountId },
      select: {
        id: true,
        name: true,
        accountid: true,
        leagueseason: {
          select: {
            id: true,
            leagueid: true,
            league: {
              select: {
                id: true,
                name: true,
              },
            },
            divisionseason: {
              select: {
                id: true,
                priority: true,
                divisiondefs: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!season) {
      return null;
    }

    return {
      ...season,
      leagueseason: season.leagueseason.map((leagueSeason) => ({
        ...leagueSeason,
        divisionseason: includeDivisions ? leagueSeason.divisionseason : undefined,
      })),
    };
  }

  async findSeasonById(accountId: bigint, seasonId: bigint): Promise<dbSeason | null> {
    return this.prisma.season.findFirst({
      where: { id: seasonId, accountid: accountId },
      select: {
        id: true,
        name: true,
        accountid: true,
      },
    });
  }

  async findSeasonByName(
    accountId: bigint,
    name: string,
    excludeSeasonId?: bigint,
  ): Promise<dbSeason | null> {
    return this.prisma.season.findFirst({
      where: {
        accountid: accountId,
        name,
        ...(excludeSeasonId ? { id: { not: excludeSeasonId } } : {}),
      },
      select: {
        id: true,
        name: true,
        accountid: true,
      },
    });
  }

  async createSeason(data: { name: string; accountid: bigint }): Promise<dbSeason> {
    return this.prisma.season.create({
      data,
      select: {
        id: true,
        name: true,
        accountid: true,
      },
    });
  }

  async updateSeasonName(seasonId: bigint, name: string): Promise<dbSeason> {
    return this.prisma.season.update({
      where: { id: seasonId },
      data: { name },
      select: {
        id: true,
        name: true,
        accountid: true,
      },
    });
  }

  async deleteSeason(seasonId: bigint): Promise<dbSeason> {
    return this.prisma.season.delete({
      where: { id: seasonId },
      select: {
        id: true,
        name: true,
        accountid: true,
      },
    });
  }

  async findCurrentSeasonRecord(accountId: bigint): Promise<dbCurrentSeason | null> {
    return this.prisma.currentseason.findUnique({
      where: { accountid: accountId },
      select: {
        accountid: true,
        seasonid: true,
      },
    });
  }

  async upsertCurrentSeason(accountId: bigint, seasonId: bigint): Promise<void> {
    await this.prisma.currentseason.upsert({
      where: { accountid: accountId },
      update: { seasonid: seasonId },
      create: { accountid: accountId, seasonid: seasonId },
    });
  }

  async createLeagueSeason(seasonId: bigint, leagueId: bigint): Promise<dbLeagueSeasonBasic> {
    return this.prisma.leagueseason.create({
      data: {
        seasonid: seasonId,
        leagueid: leagueId,
      },
      select: {
        id: true,
        seasonid: true,
        leagueid: true,
        league: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async countSeasonParticipants(accountId: bigint, seasonId: bigint): Promise<number> {
    return this.prisma.contacts.count({
      where: {
        roster: {
          rosterseason: {
            some: {
              teamsseason: {
                leagueseason: {
                  seasonid: seasonId,
                },
              },
            },
          },
        },
        creatoraccountid: accountId,
      },
    });
  }
}
