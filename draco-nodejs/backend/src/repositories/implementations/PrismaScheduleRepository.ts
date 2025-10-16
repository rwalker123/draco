import { PrismaClient, Prisma, leagueschedule, teamsseason, gamerecap } from '@prisma/client';
import {
  IScheduleRepository,
  ScheduleListFilters,
  ScheduleListOptions,
} from '../interfaces/IScheduleRepository.js';
import {
  dbScheduleGameWithDetails,
  dbScheduleGameForAccount,
  dbScheduleGameWithRecaps,
  dbGameRecap,
  dbScheduleCreateData,
  dbScheduleUpdateData,
  dbScheduleResultUpdateData,
  dbGameInfo,
} from '../types/index.js';
import { BatchQueryHelper } from './batchQueries.js';

const teamGameSelect = Prisma.validator<Prisma.leaguescheduleSelect>()({
  id: true,
  gamedate: true,
  hteamid: true,
  vteamid: true,
  leagueid: true,
  fieldid: true,
  hscore: true,
  vscore: true,
  gamestatus: true,
  gametype: true,
  comment: true,
  umpire1: true,
  umpire2: true,
  umpire3: true,
  umpire4: true,
  availablefields: true,
  hometeam: { select: { id: true, name: true } },
  visitingteam: { select: { id: true, name: true } },
  leagueseason: { select: { id: true, league: { select: { name: true } } } },
  _count: { select: { gamerecap: true } },
});

type TeamGameInfoPayload = Prisma.leaguescheduleGetPayload<{ select: typeof teamGameSelect }>;

export class PrismaScheduleRepository implements IScheduleRepository {
  constructor(private prisma: PrismaClient) {}

  private buildTeamGamesWhere(
    teamSeasonId: bigint,
    seasonId: bigint,
  ): Prisma.leaguescheduleWhereInput {
    return {
      leagueseason: {
        seasonid: seasonId,
      },
      OR: [{ hteamid: teamSeasonId }, { vteamid: teamSeasonId }],
    };
  }

  async findById(id: bigint): Promise<leagueschedule | null> {
    return this.prisma.leagueschedule.findUnique({
      where: { id },
    });
  }

  async findMany(where?: Prisma.leaguescheduleWhereInput): Promise<leagueschedule[]> {
    return this.prisma.leagueschedule.findMany({ where });
  }

  async create(data: Partial<leagueschedule>): Promise<leagueschedule> {
    return this.prisma.leagueschedule.create({
      data: data as Prisma.leaguescheduleCreateInput,
    });
  }

  async update(id: bigint, data: Partial<leagueschedule>): Promise<leagueschedule> {
    return this.prisma.leagueschedule.update({
      where: { id },
      data: data as Prisma.leaguescheduleUpdateInput,
    });
  }

  async delete(id: bigint): Promise<leagueschedule> {
    return this.prisma.leagueschedule.delete({
      where: { id },
    });
  }

  async count(where?: Prisma.leaguescheduleWhereInput): Promise<number> {
    return this.prisma.leagueschedule.count({ where });
  }

  async findGameWithAccountContext(
    gameId: bigint,
    accountId: bigint,
  ): Promise<dbScheduleGameForAccount | null> {
    return this.prisma.leagueschedule.findFirst({
      where: {
        id: gameId,
        leagueseason: {
          league: {
            accountid: accountId,
          },
        },
      },
      include: {
        leagueseason: {
          include: {
            league: true,
            season: true,
          },
        },
      },
    });
  }

  async findGameWithDetails(gameId: bigint): Promise<dbScheduleGameWithDetails | null> {
    return this.prisma.leagueschedule.findFirst({
      where: { id: gameId },
      include: {
        availablefields: true,
        leagueseason: {
          include: {
            league: true,
            season: true,
          },
        },
      },
    });
  }

  async listSeasonGames(
    seasonId: bigint,
    filters: ScheduleListFilters,
    options: ScheduleListOptions,
  ): Promise<dbScheduleGameWithDetails[] | dbScheduleGameWithRecaps[]> {
    const where: Prisma.leaguescheduleWhereInput = {
      leagueseason: {
        seasonid: seasonId,
      },
    };

    if (filters.dateRange) {
      where.gamedate = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    if (filters.teamId) {
      where.OR = [{ hteamid: filters.teamId }, { vteamid: filters.teamId }];
    }

    if (filters.includeRecaps) {
      return this.prisma.leagueschedule.findMany({
        where,
        include: {
          availablefields: true,
          leagueseason: {
            include: {
              league: true,
              season: true,
            },
          },
          gamerecap: {
            select: {
              teamid: true,
              recap: true,
            },
          },
        },
        orderBy: {
          gamedate: options.sortOrder,
        },
        skip: options.skip,
        take: options.take,
      }) as Promise<dbScheduleGameWithRecaps[]>;
    }

    return this.prisma.leagueschedule.findMany({
      where,
      include: {
        availablefields: true,
        leagueseason: {
          include: {
            league: true,
            season: true,
          },
        },
        _count: {
          select: {
            gamerecap: true,
          },
        },
      },
      orderBy: {
        gamedate: options.sortOrder,
      },
      skip: options.skip,
      take: options.take,
    }) as Promise<dbScheduleGameWithDetails[]>;
  }

  async countSeasonGames(seasonId: bigint, filters: ScheduleListFilters): Promise<number> {
    const where: Prisma.leaguescheduleWhereInput = {
      leagueseason: {
        seasonid: seasonId,
      },
    };

    if (filters.dateRange) {
      where.gamedate = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    if (filters.teamId) {
      where.OR = [{ hteamid: filters.teamId }, { vteamid: filters.teamId }];
    }

    return this.prisma.leagueschedule.count({ where });
  }

  async findTeamsInLeagueSeason(
    leagueSeasonId: bigint,
    seasonId: bigint,
    teamIds: bigint[],
  ): Promise<teamsseason[]> {
    return this.prisma.teamsseason.findMany({
      where: {
        leagueseason: {
          id: leagueSeasonId,
          seasonid: seasonId,
        },
        id: {
          in: teamIds,
        },
      },
    });
  }

  async createGame(data: dbScheduleCreateData): Promise<dbScheduleGameWithDetails> {
    return this.prisma.leagueschedule.create({
      data,
      include: {
        availablefields: true,
        leagueseason: {
          include: {
            league: true,
            season: true,
          },
        },
      },
    });
  }

  async updateGame(gameId: bigint, data: dbScheduleUpdateData): Promise<dbScheduleGameWithDetails> {
    return this.prisma.leagueschedule.update({
      where: { id: gameId },
      data,
      include: {
        availablefields: true,
        leagueseason: {
          include: {
            league: true,
            season: true,
          },
        },
      },
    });
  }

  async updateGameResults(
    gameId: bigint,
    data: dbScheduleResultUpdateData,
  ): Promise<dbScheduleGameWithDetails> {
    return this.prisma.leagueschedule.update({
      where: { id: gameId },
      data,
      include: {
        availablefields: true,
        leagueseason: {
          include: {
            league: true,
            season: true,
          },
        },
      },
    });
  }

  async deleteGame(gameId: bigint): Promise<void> {
    await this.prisma.leagueschedule.delete({
      where: { id: gameId },
    });
  }

  async findFieldConflict(
    fieldId: bigint,
    gameDate: Date,
    leagueSeasonId: bigint,
    excludeGameId?: bigint,
  ): Promise<leagueschedule | null> {
    return this.prisma.leagueschedule.findFirst({
      where: {
        fieldid: fieldId,
        gamedate: gameDate,
        leagueid: leagueSeasonId,
        ...(excludeGameId && { id: { not: excludeGameId } }),
      },
    });
  }

  async findRecap(gameId: bigint, teamSeasonId: bigint): Promise<dbGameRecap | null> {
    return this.prisma.gamerecap.findUnique({
      where: {
        gameid_teamid: {
          gameid: gameId,
          teamid: teamSeasonId,
        },
      },
      select: {
        gameid: true,
        teamid: true,
        recap: true,
      },
    });
  }

  async upsertRecap(gameId: bigint, teamSeasonId: bigint, recap: string): Promise<gamerecap> {
    return this.prisma.gamerecap.upsert({
      where: {
        gameid_teamid: {
          gameid: gameId,
          teamid: teamSeasonId,
        },
      },
      update: {
        recap,
      },
      create: {
        gameid: gameId,
        teamid: teamSeasonId,
        recap,
      },
    });
  }

  async getTeamNames(teamIds: bigint[]): Promise<Map<string, string>> {
    if (teamIds.length === 0) {
      return new Map();
    }
    return BatchQueryHelper.batchTeamNames(this.prisma, teamIds);
  }

  async listUpcomingGamesForTeam(
    teamSeasonId: bigint,
    seasonId: bigint,
    limit: number,
    referenceDate: Date,
  ): Promise<dbGameInfo[]> {
    const games: TeamGameInfoPayload[] = await this.prisma.leagueschedule.findMany({
      where: {
        ...this.buildTeamGamesWhere(teamSeasonId, seasonId),
        gamedate: { gte: referenceDate },
      },
      select: teamGameSelect,
      orderBy: { gamedate: 'asc' },
      take: Math.max(limit, 0),
    });

    return games;
  }

  async listRecentGamesForTeam(
    teamSeasonId: bigint,
    seasonId: bigint,
    limit: number,
    referenceDate: Date,
  ): Promise<dbGameInfo[]> {
    const games: TeamGameInfoPayload[] = await this.prisma.leagueschedule.findMany({
      where: {
        ...this.buildTeamGamesWhere(teamSeasonId, seasonId),
        gamedate: { lt: referenceDate },
      },
      select: teamGameSelect,
      orderBy: { gamedate: 'desc' },
      take: Math.max(limit, 0),
    });

    return games;
  }
}
