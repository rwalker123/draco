import { StatisticsService } from './statisticsService.js';
import { NotFoundError } from '../utils/customErrors.js';
import {
  AllTimeTeamSummaryType,
  BattingStatisticsFiltersSchema,
  PitchingStatisticsFiltersSchema,
  PlayerBattingStatsType,
  PlayerPitchingStatsType,
  RecentGamesType,
  TeamRecordType,
} from '@draco/shared-schemas';
import {
  RepositoryFactory,
  IBattingStatisticsRepository,
  IPitchingStatisticsRepository,
  ITeamRepository,
  IScheduleRepository,
  dbGameInfo,
} from '../repositories/index.js';
import { StatsResponseFormatter } from '../responseFormatters/index.js';
import { ServiceFactory } from './serviceFactory.js';
import { getLogoUrl } from '../config/logo.js';

export class TeamStatsService {
  private readonly statisticsService: StatisticsService;
  private readonly teamRepository: ITeamRepository;
  private readonly scheduleRepository: IScheduleRepository;
  private readonly battingStatisticsRepository: IBattingStatisticsRepository;
  private readonly pitchingStatisticsRepository: IPitchingStatisticsRepository;

  constructor() {
    this.statisticsService = ServiceFactory.getStatisticsService();
    this.teamRepository = RepositoryFactory.getTeamRepository();
    this.scheduleRepository = RepositoryFactory.getScheduleRepository();
    this.battingStatisticsRepository = RepositoryFactory.getBattingStatisticsRepository();
    this.pitchingStatisticsRepository = RepositoryFactory.getPitchingStatisticsRepository();
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
    const teamSeason = await this.teamRepository.findTeamSeason(teamSeasonId, seasonId, accountId);

    if (!teamSeason) {
      throw new NotFoundError('Team season not found');
    }

    const now = new Date();
    const upcomingGamesPromise = includeUpcoming
      ? this.scheduleRepository.listUpcomingGamesForTeam(teamSeasonId, seasonId, limit, now)
      : Promise.resolve<dbGameInfo[]>([]);

    const recentGamesPromise = includeRecent
      ? this.scheduleRepository.listRecentGamesForTeam(teamSeasonId, seasonId, limit, now)
      : Promise.resolve<dbGameInfo[]>([]);

    const [upcomingGames, recentGames] = await Promise.all([
      upcomingGamesPromise,
      recentGamesPromise,
    ]);

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
  ): Promise<PlayerBattingStatsType[]> {
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

    return battingStats;
  }

  async getTeamPitchingStats(
    teamSeasonId: bigint,
    seasonId: bigint,
    accountId: bigint,
  ): Promise<PlayerPitchingStatsType[]> {
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

    return pitchingStats;
  }

  async getAllTimeTeams(accountId: bigint): Promise<AllTimeTeamSummaryType[]> {
    const dbTeams = await this.teamRepository.findAllTimeTeams(accountId);
    return dbTeams.map((team) => ({
      teamId: team.teamid.toString(),
      names: team.names,
      leagueNames: team.leaguenames,
      seasonNames: team.seasonnames,
      seasonCount: team.seasoncount,
      logoUrl: getLogoUrl(accountId.toString(), team.teamid.toString()),
    }));
  }

  async getAllTimeTeamBattingStats(
    masterTeamId: bigint,
    accountId: bigint,
  ): Promise<PlayerBattingStatsType[]> {
    const teamDef = await this.teamRepository.findTeamDefinition(masterTeamId);
    if (!teamDef || teamDef.accountid !== accountId) {
      throw new NotFoundError('Team not found');
    }

    const stats = await this.battingStatisticsRepository.findAllTimeTeamBattingStatistics(
      masterTeamId,
      'avg',
      'desc',
      1000,
      0,
    );

    return StatsResponseFormatter.formatPlayerBattingStats(stats);
  }

  async getAllTimeTeamPitchingStats(
    masterTeamId: bigint,
    accountId: bigint,
  ): Promise<PlayerPitchingStatsType[]> {
    const teamDef = await this.teamRepository.findTeamDefinition(masterTeamId);
    if (!teamDef || teamDef.accountid !== accountId) {
      throw new NotFoundError('Team not found');
    }

    const stats = await this.pitchingStatisticsRepository.findAllTimeTeamPitchingStatistics(
      masterTeamId,
      'era',
      'asc',
      1000,
      0,
    );

    return StatsResponseFormatter.formatPlayerPitchingStats(stats);
  }
}
