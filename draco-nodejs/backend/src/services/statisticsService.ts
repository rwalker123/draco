import { PrismaClient } from '@prisma/client';
import { MinimumCalculator } from './minimumCalculator.js';
import {
  BattingStatisticsFiltersType,
  LeaderCategoriesType,
  LeaderRowType,
  LeaderStatisticsFiltersType,
  PitchingStatisticsFiltersType,
  PlayerBattingStatsType,
  PlayerPitchingStatsType,
} from '@draco/shared-schemas';
import {
  IBattingStatisticsRepository,
  ILeagueLeadersDisplayRepository,
  IPitchingStatisticsRepository,
  PlayerTeamsQueryOptions,
} from '../repositories/interfaces/index.js';
import {
  dbBattingStatisticsRow,
  dbPitchingStatisticsRow,
  dbPlayerTeamAssignment,
} from '../repositories/types/dbTypes.js';
import { StatsResponseFormatter } from '../responseFormatters/statsResponseFormatter.js';

export interface StandingsRow {
  teamName: string;
  teamId: bigint;
  leagueId: bigint;
  leagueName: string;
  divisionId: bigint | null;
  divisionName: string | null;
  divisionPriority: number | null;
  w: number;
  l: number;
  t: number; // ties
  pct: number;
  gb: number; // games back
  divisionRecord?: { w: number; l: number; t: number };
}

export interface GroupedStandingsResponse {
  leagues: LeagueStandings[];
}

export interface LeagueStandings {
  leagueId: bigint;
  leagueName: string;
  divisions: DivisionStandings[];
}

export interface DivisionStandings {
  divisionId: bigint | null;
  divisionName: string | null;
  divisionPriority: number | null;
  teams: StandingsRow[];
}

export interface StatisticsFilters {
  seasonId?: bigint;
  leagueId?: bigint;
  divisionId?: bigint;
  teamId?: bigint;
  isHistorical?: boolean;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  minAB?: number;
  minIP?: number;
  includeAllGameTypes?: boolean;
}

export class StatisticsService {
  private minimumCalculator: MinimumCalculator;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly battingStatisticsRepository: IBattingStatisticsRepository,
    private readonly pitchingStatisticsRepository: IPitchingStatisticsRepository,
    private readonly leagueLeadersDisplayRepository: ILeagueLeadersDisplayRepository,
  ) {
    this.minimumCalculator = new MinimumCalculator(prisma);
  }

  // Get configured leader categories for an account
  async getLeaderCategories(accountId: bigint): Promise<LeaderCategoriesType> {
    const categories = await this.leagueLeadersDisplayRepository.findLeaderCategories(accountId);
    return StatsResponseFormatter.formatLeaderCategories(categories);
  }

  // Get batting statistics with pagination and filtering
  async getBattingStats(
    _accountId: bigint,
    filters: BattingStatisticsFiltersType,
  ): Promise<PlayerBattingStatsType[]> {
    const stats = await this.queryBattingStats(filters);
    return StatsResponseFormatter.formatPlayerBattingStats(stats);
  }

  private async queryBattingStats(
    filters: BattingStatisticsFiltersType,
  ): Promise<dbBattingStatisticsRow[]> {
    const {
      leagueId,
      divisionId,
      teamId,
      isHistorical = false,
      sortField,
      sortOrder = 'desc',
      page = 1,
      pageSize = 50,
      minAB = isHistorical ? 150 : 30,
      includeAllGameTypes = false,
    } = filters;

    if (!sortField) {
      throw new Error('Sort field is required');
    }

    const stats = await this.battingStatisticsRepository.findBattingStatistics({
      leagueId,
      divisionId,
      teamId,
      isHistorical,
      sortField,
      sortOrder,
      page,
      pageSize,
      minAtBats: minAB,
      includeAllGameTypes,
    });

    await this.attachTeamsToStats(stats, filters, (playerIds, query) =>
      this.battingStatisticsRepository.findTeamsForPlayers(playerIds, query),
    );

    return stats;
  }

  // Helper method to fetch and add team information to player stats
  private async attachTeamsToStats(
    stats: Array<dbBattingStatisticsRow | dbPitchingStatisticsRow>,
    filters: StatisticsFilters,
    fetchTeams: (
      playerIds: bigint[],
      query: PlayerTeamsQueryOptions,
    ) => Promise<dbPlayerTeamAssignment[]>,
  ): Promise<void> {
    if (stats.length === 0) {
      return;
    }

    const playerIds = stats.map((stat) => stat.playerId);

    const teamResults = await fetchTeams(playerIds, {
      leagueId: filters.leagueId,
      teamId: filters.teamId,
      isHistorical: filters.isHistorical ?? false,
      includeAllGameTypes: filters.includeAllGameTypes ?? false,
    });

    const teamsByPlayer = new Map<string, string[]>();
    const teamIdsByPlayer = new Map<string, Set<string>>();

    for (const row of teamResults) {
      const playerId = row.playerId.toString();
      const teamId = row.teamId?.toString();
      const teamName = row.teamName ?? undefined;

      if (!teamsByPlayer.has(playerId)) {
        teamsByPlayer.set(playerId, []);
        teamIdsByPlayer.set(playerId, new Set());
      }

      if (teamName && teamId && !teamIdsByPlayer.get(playerId)!.has(teamId)) {
        teamsByPlayer.get(playerId)!.push(teamName);
        teamIdsByPlayer.get(playerId)!.add(teamId);
      }
    }

    for (const stat of stats) {
      const playerKey = stat.playerId.toString();
      const teams = teamsByPlayer.get(playerKey) ?? [];
      stat.teams = teams;
      stat.teamName = teams.length > 1 ? teams.join(', ') : (teams[0] ?? 'Unknown');
    }
  }

  // Get pitching statistics with pagination and filtering
  async getPitchingStats(
    _accountId: bigint,
    filters: PitchingStatisticsFiltersType,
  ): Promise<PlayerPitchingStatsType[]> {
    const stats = await this.queryPitchingStats(filters);
    return StatsResponseFormatter.formatPlayerPitchingStats(stats);
  }

  private async queryPitchingStats(
    filters: PitchingStatisticsFiltersType,
  ): Promise<dbPitchingStatisticsRow[]> {
    const {
      leagueId,
      divisionId,
      teamId,
      isHistorical = false,
      sortField,
      sortOrder = 'asc',
      page = 1,
      pageSize = 50,
      minIP = isHistorical ? 100 : 20,
      includeAllGameTypes = false,
    } = filters;

    if (!sortField) {
      throw new Error('Sort field is required');
    }

    const stats = await this.pitchingStatisticsRepository.findPitchingStatistics({
      leagueId,
      divisionId,
      teamId,
      isHistorical,
      sortField,
      sortOrder,
      page,
      pageSize,
      minInningsPitched: minIP,
      includeAllGameTypes,
    });

    await this.attachTeamsToStats(stats, filters, (playerIds, query) =>
      this.pitchingStatisticsRepository.findTeamsForPlayers(playerIds, query),
    );

    return stats;
  }

  // Get statistical leaders for a category
  async getLeaders(
    accountId: bigint,
    category: string,
    filters: LeaderStatisticsFiltersType,
  ): Promise<LeaderRowType[]> {
    // Check the database to determine if this is a batting or pitching stat
    const categoryConfig = await this.leagueLeadersDisplayRepository.findCategory(
      accountId,
      category.toLowerCase(),
    );

    const isBattingStat = categoryConfig?.isbatleader ?? this.isBattingCategory(category);

    // Calculate dynamic minimums based on ASP.NET logic
    let minAB = 0;
    let minIP = 0;

    if (isBattingStat && this.requiresMinimumAB(category)) {
      if (filters.isHistorical) {
        minAB = MinimumCalculator.ALL_TIME_MIN_AB;
      } else if (filters.teamId) {
        minAB = await this.minimumCalculator.calculateTeamMinAB(filters.teamId);
      } else if (filters.leagueId) {
        minAB = await this.minimumCalculator.calculateLeagueMinAB(filters.leagueId);
      } else {
        minAB = MinimumCalculator.MIN_AB_PER_SEASON;
      }
    }

    if (!isBattingStat && this.requiresMinimumIP(category)) {
      if (filters.isHistorical) {
        minIP = MinimumCalculator.ALL_TIME_MIN_IP;
      } else if (filters.teamId) {
        minIP = await this.minimumCalculator.calculateTeamMinIP(filters.teamId);
      } else if (filters.leagueId) {
        minIP = await this.minimumCalculator.calculateLeagueMinIP(filters.leagueId);
      } else {
        minIP = MinimumCalculator.MIN_IP_PER_SEASON;
      }
    }

    // Apply calculated minimums to filters
    // Get more records than needed to handle ties properly
    const queryLimit = Math.max(50, filters.limit * 10);
    const updatedFilters = {
      ...filters,
      pageSize: queryLimit,
      minAB: Math.max(minAB, filters.minAB || 0),
      minIP: Math.max(minIP, filters.minIP || 0),
    };

    const leaders = isBattingStat
      ? await this.getBattingLeaders(accountId, category, updatedFilters)
      : await this.getPitchingLeaders(accountId, category, updatedFilters);

    return StatsResponseFormatter.formatLeaderRows(leaders, accountId);
  }

  // Get standings for a season
  async getStandings(accountId: bigint, seasonId: bigint): Promise<StandingsRow[]> {
    // Simplified query: only aggregate wins, losses, ties
    const query = `
      SELECT 
        ts.name as "teamName",
        ts.id as "teamId",
        ls.id as "leagueId",
        l.name as "leagueName",
        ds.id as "divisionId",
        dd.name as "divisionName",
        ds.priority as "divisionPriority",
        COALESCE(SUM(CASE 
          WHEN lg.gamestatus = 1 AND (
            (lg.hteamid = ts.id AND lg.hscore > lg.vscore) OR 
            (lg.vteamid = ts.id AND lg.vscore > lg.hscore)
          ) THEN 1 ELSE 0 END), 0)::int as w,
        COALESCE(SUM(CASE 
          WHEN lg.gamestatus = 1 AND (
            (lg.hteamid = ts.id AND lg.hscore < lg.vscore) OR 
            (lg.vteamid = ts.id AND lg.vscore < lg.hscore)
          ) THEN 1
          WHEN lg.gamestatus = 5 AND (lg.hteamid = ts.id OR lg.vteamid = ts.id) THEN 1
          WHEN lg.gamestatus = 4 AND (lg.hteamid = ts.id OR lg.vteamid = ts.id) THEN 1
          ELSE 0 END), 0)::int as l,
        COALESCE(SUM(CASE 
          WHEN lg.gamestatus = 1 AND lg.hscore = lg.vscore AND (lg.hteamid = ts.id OR lg.vteamid = ts.id) 
          THEN 1 ELSE 0 END), 0)::int as t,
        -- Division Wins
        COALESCE(SUM(CASE
          WHEN lg.gamestatus = 1
            AND (
              (lg.hteamid = ts.id AND lg.hscore > lg.vscore)
              OR (lg.vteamid = ts.id AND lg.vscore > lg.hscore)
            )
            AND hts.divisionseasonid = vts.divisionseasonid
            AND hts.divisionseasonid = ts.divisionseasonid
            AND hts.divisionseasonid IS NOT NULL
          THEN 1 ELSE 0 END), 0)::int as div_w,
        -- Division Losses
        COALESCE(SUM(CASE
          WHEN (
            (lg.gamestatus = 1 AND (
              (lg.hteamid = ts.id AND lg.hscore < lg.vscore)
              OR (lg.vteamid = ts.id AND lg.vscore < lg.hscore)
            ))
            OR (lg.gamestatus IN (4, 5) AND (lg.hteamid = ts.id OR lg.vteamid = ts.id))
          )
            AND hts.divisionseasonid = vts.divisionseasonid
            AND hts.divisionseasonid = ts.divisionseasonid
            AND hts.divisionseasonid IS NOT NULL
          THEN 1 ELSE 0 END), 0)::int as div_l,
        -- Division Ties
        COALESCE(SUM(CASE
          WHEN lg.gamestatus = 1
            AND lg.hscore = lg.vscore
            AND (lg.hteamid = ts.id OR lg.vteamid = ts.id)
            AND hts.divisionseasonid = vts.divisionseasonid
            AND hts.divisionseasonid = ts.divisionseasonid
            AND hts.divisionseasonid IS NOT NULL
          THEN 1 ELSE 0 END), 0)::int as div_t
      FROM teams t
      INNER JOIN teamsseason ts ON t.id = ts.teamid
      INNER JOIN leagueseason ls ON ts.leagueseasonid = ls.id
      INNER JOIN league l ON ls.leagueid = l.id
      LEFT JOIN divisionseason ds ON ts.divisionseasonid = ds.id
      LEFT JOIN divisiondefs dd ON ds.divisionid = dd.id
      LEFT JOIN leagueschedule lg ON (lg.hteamid = ts.id OR lg.vteamid = ts.id) 
        AND lg.gamestatus IN (1, 4, 5)
        AND lg.leagueid = ls.id
      LEFT JOIN teamsseason hts ON lg.hteamid = hts.id
      LEFT JOIN teamsseason vts ON lg.vteamid = vts.id
      WHERE ls.seasonid = $1
        AND t.accountid = $2
      GROUP BY ts.id, ts.name, ls.id, l.name, ds.id, dd.name, ds.priority
      ORDER BY l.name, w DESC
    `;

    const result = await this.prisma.$queryRawUnsafe(query, seasonId, accountId);
    const rawStandings = result as Array<{
      teamName: string;
      teamId: bigint;
      leagueId: bigint;
      leagueName: string;
      divisionId: bigint | null;
      divisionName: string | null;
      divisionPriority: number | null;
      w: number;
      l: number;
      t: number;
      div_w: number;
      div_l: number;
      div_t: number;
    }>;

    // Map to StandingsRow format and calculate pct
    const standings: StandingsRow[] = rawStandings.map((team) => {
      const w = Number(team.w);
      const l = Number(team.l);
      const t = Number(team.t);
      const totalGames = w + l + t;
      const pct = totalGames > 0 ? (w + 0.5 * t) / totalGames : 0;

      return {
        teamName: team.teamName,
        teamId: team.teamId,
        leagueId: team.leagueId,
        leagueName: team.leagueName,
        divisionId: team.divisionId,
        divisionName: team.divisionName,
        divisionPriority: team.divisionPriority,
        w,
        l,
        t,
        pct,
        gb: 0, // Will be calculated later
        divisionRecord: { w: team.div_w, l: team.div_l, t: team.div_t },
      };
    });

    return standings;
  }

  async getGroupedStandings(
    accountId: bigint,
    seasonId: bigint,
  ): Promise<GroupedStandingsResponse> {
    const standings = await this.getStandings(accountId, seasonId);

    // Group by league and division
    const leaguesMap = new Map<string, LeagueStandings>();

    for (const team of standings) {
      // Skip teams that are not assigned to a proper division
      if (!team.divisionId || !team.divisionName) {
        continue;
      }

      const leagueKey = team.leagueId.toString();

      if (!leaguesMap.has(leagueKey)) {
        leaguesMap.set(leagueKey, {
          leagueId: team.leagueId,
          leagueName: team.leagueName,
          divisions: [],
        });
      }

      const league = leaguesMap.get(leagueKey)!;
      const divisionKey = team.divisionId.toString();

      let division = league.divisions.find(
        (d) => d.divisionId !== null && d.divisionId.toString() === divisionKey,
      );

      if (!division) {
        division = {
          divisionId: team.divisionId,
          divisionName: team.divisionName,
          divisionPriority: team.divisionPriority,
          teams: [],
        };
        league.divisions.push(division);
      }

      division.teams.push(team);
    }

    // Sort divisions by priority within each league and calculate games back
    for (const league of leaguesMap.values()) {
      league.divisions.sort((a, b) => {
        const aPriority = a.divisionPriority ?? 999999;
        const bPriority = b.divisionPriority ?? 999999;
        return aPriority - bPriority;
      });

      // Calculate games back within each division
      for (const division of league.divisions) {
        // Sort teams by winning percentage (descending), then by wins (descending)
        division.teams.sort((a, b) => {
          if (b.pct !== a.pct) return b.pct - a.pct;
          return b.w - a.w;
        });

        // Calculate games back for each team relative to division leader
        if (division.teams.length > 0) {
          const leader = division.teams[0];
          const leaderWins = leader.w;
          const leaderLosses = leader.l;
          const leaderTies = leader.t;

          // Calculate leader's winning points (wins + 0.5 * ties)
          const leaderPoints = leaderWins + leaderTies * 0.5;

          for (const team of division.teams) {
            if (team === leader) {
              team.gb = 0;
            } else {
              // Calculate team's winning points (wins + 0.5 * ties)
              const teamPoints = team.w + team.t * 0.5;

              // Games back formula with ties:
              // GB = ((leaderPoints - teamPoints) + (teamLosses - leaderLosses)) / 2
              // Simplified: GB = (leaderPoints - teamPoints + teamLosses - leaderLosses) / 2
              const pointsDiff = leaderPoints - teamPoints;
              const lossesDiff = team.l - leaderLosses;
              const gb = (pointsDiff + lossesDiff) / 2;

              team.gb = Math.max(0, gb); // Don't show negative games back
            }
          }
        }
      }
    }

    return {
      leagues: Array.from(leaguesMap.values()).sort((a, b) =>
        a.leagueName.localeCompare(b.leagueName),
      ),
    };
  }

  // Helper methods

  /**
   * Determine if a batting category requires minimum AB
   * Based on ASP.NET logic - rate stats need minimums
   */
  private requiresMinimumAB(category: string): boolean {
    const rateStats = ['avg', 'obp', 'slg', 'ops'];
    return rateStats.includes(category.toLowerCase());
  }

  /**
   * Determine if a pitching category requires minimum IP
   * Based on ASP.NET logic - rate stats need minimums
   */
  private requiresMinimumIP(category: string): boolean {
    const rateStats = ['era', 'whip', 'k9', 'bb9', 'oba'];
    return rateStats.includes(category.toLowerCase());
  }

  private isBattingCategory(category: string): boolean {
    const battingCategories = [
      'avg',
      'obp',
      'slg',
      'ops',
      'ab',
      'h',
      'r',
      'hr',
      'rbi',
      'bb',
      'so',
      'sb',
      'tb',
      'pa',
    ];
    return battingCategories.includes(category.toLowerCase());
  }

  private async getBattingLeaders(
    _accountId: bigint,
    category: string,
    filters: LeaderStatisticsFiltersType,
  ): Promise<LeaderRowType[]> {
    const sortOrder = this.getBattingSortOrder(category);
    const stats = await this.queryBattingStats({
      leagueId: filters.leagueId,
      divisionId: filters.divisionId,
      teamId: filters.teamId,
      isHistorical: filters.isHistorical,
      includeAllGameTypes: filters.includeAllGameTypes,
      page: filters.page,
      pageSize: filters.pageSize,
      minAB: filters.minAB,
      sortField: category,
      sortOrder,
    });

    return this.processLeadersWithTies(stats, category, filters.limit, (stat) =>
      this.getStatValue(stat, category),
    );
  }

  private async getPitchingLeaders(
    _accountId: bigint,
    category: string,
    filters: LeaderStatisticsFiltersType,
  ): Promise<LeaderRowType[]> {
    const sortOrder = this.getPitchingSortOrder(category);
    const stats = await this.queryPitchingStats({
      leagueId: filters.leagueId,
      divisionId: filters.divisionId,
      teamId: filters.teamId,
      isHistorical: filters.isHistorical,
      includeAllGameTypes: filters.includeAllGameTypes,
      page: filters.page,
      pageSize: filters.pageSize,
      minIP: filters.minIP,
      sortField: category,
      sortOrder,
    });

    return this.processLeadersWithTies(stats, category, filters.limit, (stat) =>
      this.getPitchingStatValue(stat, category),
    );
  }

  /**
   * Process leaders with proper tie handling based on ASP.NET ProcessLeaders logic
   */
  private processLeadersWithTies<
    T extends { playerId: bigint; playerName: string; teamName?: string; teams?: string[] },
  >(
    stats: T[],
    category: string,
    limit: number,
    getStatValue: (stat: T) => number,
  ): LeaderRowType[] {
    const result: LeaderRowType[] = [];
    const leadersByValue = new Map<number, T[]>();
    const leaderValues: number[] = [];
    let numRecords = 0;

    // Group stats by their values (to handle ties)
    for (const stat of stats) {
      const statValue = getStatValue(stat);

      if (leadersByValue.has(statValue)) {
        leadersByValue.get(statValue)!.push(stat);
      } else {
        // If we need to add a new value group, check if we exceed limit
        if (numRecords >= limit) {
          break;
        }

        leaderValues.push(statValue);
        leadersByValue.set(statValue, [stat]);
      }

      numRecords++;
    }

    // Process each value group
    let currentRank = 1;
    for (const value of leaderValues) {
      const playersWithValue = leadersByValue.get(value)!;

      // If we can display all players in this tie group within the limit
      if (playersWithValue.length + result.length <= limit) {
        for (const player of playersWithValue) {
          const teams = player.teams?.length ? player.teams : undefined;
          let teamName = player.teamName ?? '';

          if (!player.teamName || player.teamName.trim().length === 0) {
            if (teams && teams.length > 0) {
              teamName = teams.length > 1 ? teams.join(', ') : teams[0];
            } else {
              teamName = 'Unknown';
            }
          }

          const formatted: LeaderRowType = {
            playerId: player.playerId.toString(),
            playerName: player.playerName,
            teamName,
            statValue: value,
            category,
            rank: currentRank,
          };

          if (teams) {
            formatted.teams = teams;
          }

          result.push(formatted);
        }
        currentRank += playersWithValue.length;
      } else if (result.length < limit) {
        // We have space but not enough for all tied players, show tie indicator
        result.push({
          playerId: '0',
          playerName: '',
          teamName: '',
          statValue: value,
          category,
          rank: currentRank,
          isTie: true,
          tieCount: playersWithValue.length,
        });
        break;
      } else {
        // We've reached the limit, stop processing
        break;
      }
    }

    return result;
  }

  private getStatValue(stat: dbBattingStatisticsRow, category: string): number {
    const categoryMap: { [key: string]: keyof dbBattingStatisticsRow } = {
      avg: 'avg',
      obp: 'obp',
      slg: 'slg',
      ops: 'ops',
      ab: 'ab',
      h: 'h',
      r: 'r',
      hr: 'hr',
      rbi: 'rbi',
      bb: 'bb',
      so: 'so',
      sb: 'sb',
      tb: 'tb',
      pa: 'pa',
    };
    const normalizedCategory = category.toLowerCase();
    const value = stat[categoryMap[normalizedCategory]];

    return (value as number) || 0;
  }

  private getPitchingStatValue(stat: dbPitchingStatisticsRow, category: string): number {
    const categoryMap: { [key: string]: keyof dbPitchingStatisticsRow } = {
      era: 'era',
      whip: 'whip',
      k9: 'k9',
      bb9: 'bb9',
      w: 'w',
      l: 'l',
      s: 's',
      so: 'so',
      ip: 'ipDecimal',
      h: 'h',
      r: 'r',
      er: 'er',
      bb: 'bb',
      bf: 'bf',
    };
    const normalizedCategory = category.toLowerCase();
    return (stat[categoryMap[normalizedCategory]] as number) || 0;
  }

  private getBattingSortOrder(category: string): 'asc' | 'desc' {
    // For batting stats, higher is generally better except for strikeouts
    const ascendingStats = ['so']; // strikeouts - lower is better
    const normalizedCategory = category.toLowerCase();
    return ascendingStats.includes(normalizedCategory) ? 'asc' : 'desc';
  }

  private getPitchingSortOrder(category: string): 'asc' | 'desc' {
    // For pitching stats, lower is generally better for rates, higher for counting stats
    const ascendingStats = ['era', 'whip', 'bb9', 'l', 'h', 'r', 'er', 'bb']; // lower is better
    const normalizedCategory = category.toLowerCase();
    return ascendingStats.includes(normalizedCategory) ? 'asc' : 'desc';
  }
}
