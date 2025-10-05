import { PrismaClient } from '@prisma/client';
import { StatisticsService } from './statisticsService.js';
import { NotFoundError } from '../utils/customErrors.js';
import {
  BattingStatisticsFiltersSchema,
  PitchingStatisticsFiltersSchema,
  PlayerBattingStatsBriefType,
  PlayerPitchingStatsBriefType,
  RecentGamesType,
  TeamRecordType,
} from '@draco/shared-schemas';
import { RepositoryFactory, ITeamRepository, dbGameInfo } from '../repositories/index.js';
import { StatsResponseFormatter } from '../responseFormatters/index.js';
import { ServiceFactory } from './serviceFactory.js';

export class TeamStatsService {
  private statisticsService: StatisticsService;
  private teamRepository: ITeamRepository;

  constructor(private prisma: PrismaClient) {
    this.statisticsService = ServiceFactory.getStatisticsService();
    this.teamRepository = RepositoryFactory.getTeamRepository();
  }

  async getTeamRecord(teamSeasonId: bigint): Promise<TeamRecordType> {
    const dbRecord = await this.teamRepository.getTeamRecord(teamSeasonId);
    return {
      w: dbRecord.wins,
      l: dbRecord.losses,
      t: dbRecord.ties,
    };
  }

  async getTeamGames(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
    options: {
      includeUpcoming?: boolean;
      includeRecent?: boolean;
      limit?: number;
    } = {},
  ): Promise<RecentGamesType> {
    const { includeUpcoming = true, includeRecent = true, limit = 5 } = options;

    // Validate team/season/account relationship
    const teamSeason = await this.prisma.teamsseason.findFirst({
      where: {
        id: teamSeasonId,
        leagueseason: {
          seasonid: seasonId,
          league: {
            accountid: accountId,
          },
        },
      },
      include: {
        leagueseason: {
          include: {
            league: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!teamSeason) {
      throw new NotFoundError('Team season not found');
    }

    // Helper to get team names
    const getTeamNames = async (homeTeamId: bigint, awayTeamId: bigint) => {
      const teams = await this.prisma.teamsseason.findMany({
        where: {
          id: { in: [homeTeamId, awayTeamId] },
        },
        select: { id: true, name: true },
      });
      const homeTeam = teams.find((t) => t.id === homeTeamId);
      const awayTeam = teams.find((t) => t.id === awayTeamId);
      return {
        homeTeamName: homeTeam?.name || `Team ${homeTeamId}`,
        awayTeamName: awayTeam?.name || `Team ${awayTeamId}`,
      };
    };

    const now = new Date();
    let upcomingGames: dbGameInfo[] = [];
    let recentGames: dbGameInfo[] = [];

    if (includeUpcoming) {
      // Upcoming: games in the future, order by soonest
      upcomingGames = await this.prisma.leagueschedule.findMany({
        where: {
          gamedate: { gte: now },
          leagueseason: {
            seasonid: seasonId,
          },
          OR: [{ hteamid: teamSeason.id }, { vteamid: teamSeason.id }],
        },
        include: {
          availablefields: true,
          hometeam: { select: { id: true, name: true } },
          visitingteam: { select: { id: true, name: true } },
          leagueseason: { select: { id: true, league: { select: { name: true } } } },
          _count: { select: { gamerecap: true } },
        },
        orderBy: { gamedate: 'asc' },
        take: limit,
      });
    }

    if (includeRecent) {
      // Recent: games in the past, order by most recent
      recentGames = await this.prisma.leagueschedule.findMany({
        where: {
          gamedate: { lt: now },
          leagueseason: {
            seasonid: seasonId,
          },
          OR: [{ hteamid: teamSeason.id }, { vteamid: teamSeason.id }],
        },
        include: {
          availablefields: true,
          hometeam: { select: { id: true, name: true } },
          visitingteam: { select: { id: true, name: true } },
          leagueseason: { select: { id: true, league: { select: { name: true } } } },
          _count: { select: { gamerecap: true } },
        },
        orderBy: { gamedate: 'desc' },
        take: limit,
      });
    }

    // Map games with team names (async)
    const result: RecentGamesType = {
      upcoming: [],
      recent: [],
    };

    if (includeUpcoming) {
      result.upcoming = upcomingGames.map((game) =>
        StatsResponseFormatter.formatGameInfoResponse(game),
      );
    }

    if (includeRecent) {
      result.recent = recentGames.map((game) =>
        StatsResponseFormatter.formatGameInfoResponse(game),
      );
    }

    return result;
  }

  async getTeamBattingStats(
    teamSeasonId: bigint,
    accountId: bigint,
  ): Promise<PlayerBattingStatsBriefType[]> {
    // Use the statistics service to get batting stats for this team
    const filters = BattingStatisticsFiltersSchema.parse({
      teamId: teamSeasonId.toString(),
      sortField: 'avg',
      sortOrder: 'desc',
      pageSize: '1000', // Get all players on the team
      minAB: '0', // No minimum requirements for team stats
      includeAllGameTypes: 'true', // Include both regular season and postseason
    });

    const battingStats = await this.statisticsService.getBattingStats(accountId, filters);

    const stats = battingStats.map((stat) => ({
      playerId: stat.playerId.toString(),
      playerName: stat.playerName,
      atBats: typeof stat.ab === 'number' ? stat.ab : 0,
      hits: typeof stat.h === 'number' ? stat.h : 0,
      doubles: typeof stat.d === 'number' ? stat.d : 0,
      triples: typeof stat.t === 'number' ? stat.t : 0,
      homeRuns: typeof stat.hr === 'number' ? stat.hr : 0,
      rbis: typeof stat.rbi === 'number' ? stat.rbi : 0,
      runs: typeof stat.r === 'number' ? stat.r : 0,
      walks: typeof stat.bb === 'number' ? stat.bb : 0,
      strikeouts: typeof stat.so === 'number' ? stat.so : 0,
      avg: stat.avg,
      obp: stat.obp,
      slg: stat.slg,
      ops: stat.ops,
    }));

    return StatsResponseFormatter.formatBattingStatsResponse(stats);
  }

  async getTeamPitchingStats(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<PlayerPitchingStatsBriefType[]> {
    // Use the statistics service to get pitching stats for this team
    const filters = PitchingStatisticsFiltersSchema.parse({
      teamId: teamSeasonId.toString(),
      sortField: 'era',
      sortOrder: 'asc',
      pageSize: '1000', // Get all players on the team
      minIP: '0', // No minimum requirements for team stats
      includeAllGameTypes: 'true', // Include both regular season and postseason
    });
    const pitchingStats = await this.statisticsService.getPitchingStats(accountId, filters);

    const stats = pitchingStats.map((stat) => ({
      playerId: stat.playerId.toString(),
      playerName: stat.playerName,
      wins: typeof stat.w === 'number' ? stat.w : 0,
      losses: typeof stat.l === 'number' ? stat.l : 0,
      saves: typeof stat.s === 'number' ? stat.s : 0,
      inningsPitched: typeof stat.ip === 'number' ? stat.ip : 0,
      hits: typeof stat.h === 'number' ? stat.h : 0,
      runs: typeof stat.r === 'number' ? stat.r : 0,
      earnedRuns: typeof stat.er === 'number' ? stat.er : 0,
      walks: typeof stat.bb === 'number' ? stat.bb : 0,
      strikeouts: typeof stat.so === 'number' ? stat.so : 0,
      era: stat.era,
      whip: stat.whip,
    }));

    return StatsResponseFormatter.formatPitchingStatsResponse(stats);
  }
}
