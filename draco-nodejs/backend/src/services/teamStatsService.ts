import { PrismaClient, leagueschedule, availablefields } from '@prisma/client';
import { getGameStatusText, getGameStatusShortText } from '../utils/gameStatus.js';
import { StatisticsService } from './statisticsService.js';
import { DateUtils } from '../utils/dateUtils.js';
import { NotFoundError } from '../utils/customErrors.js';
import {
  BattingStatisticsFiltersSchema,
  PitchingStatisticsFiltersSchema,
  RecentGamesType,
  TeamRecordType,
} from '@draco/shared-schemas';
import { RepositoryFactory, ITeamRepository, dbGameInfo } from '../repositories/index.js';
import { StatsResponseFormatter } from '../responseFormatters/index.js';
import { ServiceFactory } from './serviceFactory.js';

export interface GameInfo {
  id: string;
  date: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  gameStatus: number | null;
  gameStatusText: string;
  gameStatusShortText: string;
  leagueName: string;
  fieldId: string | null;
  fieldName: string | null;
  fieldShortName: string | null;
  hasGameRecap: boolean;
  gameType: number | null;
}

export interface BattingStat {
  playerId: string;
  playerName: string;
  atBats: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbis: number;
  runs: number;
  walks: number;
  strikeouts: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
}

export interface PitchingStat {
  playerId: string;
  playerName: string;
  wins: number;
  losses: number;
  saves: number;
  inningsPitched: number;
  hits: number;
  runs: number;
  earnedRuns: number;
  walks: number;
  strikeouts: number;
  era: number;
  whip: number;
}

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

    const mapGame = async (
      game: leagueschedule & { availablefields?: availablefields | null },
    ): Promise<GameInfo> => {
      const teamNames = await getTeamNames(game.hteamid, game.vteamid);
      // Check if any gamerecap exists for this game
      const recapCount = await this.prisma.gamerecap.count({
        where: { gameid: game.id },
      });
      return {
        id: game.id.toString(),
        date: DateUtils.formatDateTimeForResponse(game.gamedate),
        homeTeamId: game.hteamid ? game.hteamid.toString() : null,
        awayTeamId: game.vteamid ? game.vteamid.toString() : null,
        homeTeamName: teamNames.homeTeamName,
        awayTeamName: teamNames.awayTeamName,
        homeScore: game.hscore,
        awayScore: game.vscore,
        gameStatus: game.gamestatus,
        gameStatusText: getGameStatusText(game.gamestatus),
        gameStatusShortText: getGameStatusShortText(game.gamestatus),
        leagueName: teamSeason.leagueseason.league.name,
        fieldId: game.fieldid ? game.fieldid.toString() : null,
        fieldName: game.availablefields ? game.availablefields.name : null,
        fieldShortName: game.availablefields ? game.availablefields.shortname : null,
        hasGameRecap: recapCount > 0,
        gameType: game.gametype ? Number(game.gametype) : null,
      };
    };

    await mapGame;

    const now = new Date();
    let upcomingGames: (leagueschedule & { availablefields?: availablefields | null })[] = [];
    let recentGames: (leagueschedule & { availablefields?: availablefields | null })[] = [];

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
        include: { availablefields: true },
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
        include: { availablefields: true },
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
        StatsResponseFormatter.formatGameInfoResponse(game as dbGameInfo),
      );
    }

    if (includeRecent) {
      result.recent = recentGames.map((game) =>
        StatsResponseFormatter.formatGameInfoResponse(game as dbGameInfo),
      );
    }

    return result;
  }

  async getTeamBattingStats(teamSeasonId: bigint, accountId: bigint): Promise<BattingStat[]> {
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

    return battingStats.map((stat) => ({
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
  }

  async getTeamPitchingStats(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<PitchingStat[]> {
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

    return pitchingStats.map((stat) => ({
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
  }
}
