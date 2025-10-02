import { PrismaClient } from '@prisma/client';
import { MinimumCalculator } from './minimumCalculator.js';
import { GameType } from '../types/gameEnums.js';
import {
  BattingStatisticsFiltersType,
  LeaderCategoriesType,
  LeaderStatisticsFiltersType,
  PitchingStatisticsFiltersType,
} from '@draco/shared-schemas';

export interface BattingStatsRow {
  playerId: bigint;
  playerName: string;
  teams?: string[]; // Array of team names player played for
  teamName: string; // Formatted string of teams for display
  ab: number;
  h: number;
  r: number;
  d: number; // doubles
  t: number; // triples
  hr: number;
  rbi: number;
  bb: number;
  so: number;
  hbp: number;
  sb: number;
  sf: number;
  sh: number;
  // Calculated fields
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  tb: number;
  pa: number;
  [key: string]: string | number | bigint | string[] | undefined;
}

export interface PitchingStatsRow {
  playerId: bigint;
  playerName: string;
  teams?: string[]; // Array of team names player played for
  teamName: string; // Formatted string of teams for display
  ip: number;
  ip2: number; // partial innings (outs)
  w: number;
  l: number;
  s: number; // saves
  h: number;
  r: number;
  er: number;
  bb: number;
  so: number;
  hr: number;
  bf: number; // batters faced
  wp: number; // wild pitches
  hbp: number;
  // Calculated fields
  era: number;
  whip: number;
  k9: number;
  bb9: number;
  oba: number; // opponent batting average
  slg: number; // opponent slugging
  ipDecimal: number; // innings pitched as decimal
  [key: string]: string | number | bigint | string[] | undefined;
}

export interface LeaderRow {
  playerId: bigint;
  playerName: string;
  teams?: string[]; // Array of team names player played for
  teamName: string; // Formatted string of teams for display
  statValue: number;
  category: string;
  rank: number;
  isTie?: boolean;
  tieCount?: number;
  [key: string]: string | number | bigint | boolean | undefined | string[];
}

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
  private prisma: PrismaClient;
  private minimumCalculator: MinimumCalculator;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.minimumCalculator = new MinimumCalculator(prisma);
  }

  // Get configured leader categories for an account
  async getLeaderCategories(accountId: bigint): Promise<LeaderCategoriesType> {
    const categories = await this.prisma.displayleagueleaders.findMany({
      where: { accountid: accountId },
      select: {
        fieldname: true,
        isbatleader: true,
      },
      orderBy: {
        fieldname: 'asc',
      },
    });

    const batting = categories
      .filter((cat) => cat.isbatleader)
      .map((cat) => ({
        key: cat.fieldname,
        label: this.getStatLabel(cat.fieldname),
        format: this.getStatFormat(cat.fieldname),
      }));

    const pitching = categories
      .filter((cat) => !cat.isbatleader)
      .map((cat) => ({
        key: cat.fieldname,
        label: this.getStatLabel(cat.fieldname),
        format: this.getStatFormat(cat.fieldname),
      }));

    return { batting, pitching };
  }

  // Get batting statistics with pagination and filtering
  async getBattingStats(
    _accountId: bigint,
    filters: BattingStatisticsFiltersType,
  ): Promise<BattingStatsRow[]> {
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

    const offset = (page - 1) * pageSize;

    // Build the base query
    let whereClause = '';
    const params: (bigint | number)[] = [];

    if (leagueId && leagueId !== BigInt(0)) {
      if (isHistorical) {
        // For all-time stats, filter by league.id (not leagueseason.id)
        whereClause += ' AND ls.leagueid = $' + (params.length + 1);
      } else {
        // For season stats, filter by leagueseason.id
        whereClause += ' AND ls.id = $' + (params.length + 1);
      }
      params.push(leagueId);
    }

    if (divisionId && divisionId !== BigInt(0)) {
      whereClause += ' AND ts.divisionseasonid = $' + (params.length + 1);
      params.push(divisionId);
    }

    if (teamId && teamId !== BigInt(0)) {
      whereClause += ' AND bs.teamid = $' + (params.length + 1);
      params.push(teamId);
    }

    // For rate stats, add minimum AB requirement if specified
    const havingClause = minAB > 0 ? `HAVING SUM(bs.ab) >= ${minAB}` : '';

    if (!sortField) {
      throw new Error('Sort field is required');
    }

    const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const sortFieldSql = sortField.toLowerCase();

    // Conditionally include teamsseason JOIN only if filtering by division
    const teamJoin =
      divisionId && divisionId !== BigInt(0) ? 'LEFT JOIN teamsseason ts ON bs.teamid = ts.id' : '';

    const query = `
      SELECT 
        c.id as "playerId",
        CONCAT(c.firstname, ' ', c.lastname) as "playerName",
        SUM(bs.ab)::int as ab,
        SUM(bs.h)::int as h,
        SUM(bs.r)::int as r,
        SUM(bs.d)::int as d,
        SUM(bs.t)::int as t,
        SUM(bs.hr)::int as hr,
        SUM(bs.rbi)::int as rbi,
        SUM(bs.bb)::int as bb,
        SUM(bs.so)::int as so,
        SUM(bs.hbp)::int as hbp,
        SUM(bs.sb)::int as sb,
        SUM(bs.sf)::int as sf,
        SUM(bs.sh)::int as sh,
        -- Calculated fields
        CASE WHEN SUM(bs.ab) = 0 THEN 0 ELSE (SUM(bs.h)::float / SUM(bs.ab)) END as avg,
        CASE WHEN (SUM(bs.ab) + SUM(bs.bb) + SUM(bs.hbp)) = 0 THEN 0 
             ELSE ((SUM(bs.h) + SUM(bs.bb) + SUM(bs.hbp))::float / (SUM(bs.ab) + SUM(bs.bb) + SUM(bs.hbp))) 
        END as obp,
        CASE WHEN SUM(bs.ab) = 0 THEN 0 
             ELSE ((SUM(bs.d) * 2 + SUM(bs.t) * 3 + SUM(bs.hr) * 4 + (SUM(bs.h) - SUM(bs.d) - SUM(bs.t) - SUM(bs.hr)))::float / SUM(bs.ab)) 
        END as slg,
        (CASE WHEN SUM(bs.ab) = 0 THEN 0 
              ELSE ((SUM(bs.d) * 2 + SUM(bs.t) * 3 + SUM(bs.hr) * 4 + (SUM(bs.h) - SUM(bs.d) - SUM(bs.t) - SUM(bs.hr)))::float / SUM(bs.ab)) 
         END +
         CASE WHEN (SUM(bs.ab) + SUM(bs.bb) + SUM(bs.hbp)) = 0 THEN 0 
              ELSE ((SUM(bs.h) + SUM(bs.bb) + SUM(bs.hbp))::float / (SUM(bs.ab) + SUM(bs.bb) + SUM(bs.hbp))) 
         END) as ops,
        (SUM(bs.d) * 2 + SUM(bs.t) * 3 + SUM(bs.hr) * 4 + (SUM(bs.h) - SUM(bs.d) - SUM(bs.t) - SUM(bs.hr)))::int as tb,
        (SUM(bs.ab) + SUM(bs.bb) + SUM(bs.hbp) + SUM(bs.sf) + SUM(bs.sh))::int as pa
      FROM batstatsum bs
      LEFT JOIN rosterseason rs ON bs.playerid = rs.id
      LEFT JOIN roster r ON rs.playerid = r.id
      LEFT JOIN contacts c ON r.contactid = c.id
      LEFT JOIN leagueschedule lg ON bs.gameid = lg.id
      LEFT JOIN leagueseason ls ON lg.leagueid = ls.id
      ${teamJoin}
      WHERE ${includeAllGameTypes ? `lg.gametype IN (${GameType.RegularSeason}, ${GameType.Playoff})` : `lg.gametype = ${GameType.RegularSeason}`}
        ${whereClause}
      GROUP BY c.id, c.firstname, c.lastname
      ${havingClause}
      ORDER BY ${sortFieldSql} ${orderDirection}
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const result = await this.prisma.$queryRawUnsafe(query, ...params);
    const battingStats = result as BattingStatsRow[];

    // Fetch teams for each player
    await this.addTeamsToStats(battingStats, filters);

    return battingStats;
  }

  // Helper method to fetch and add team information to player stats
  private async addTeamsToStats(
    stats: (BattingStatsRow | PitchingStatsRow)[],
    filters: StatisticsFilters,
  ): Promise<void> {
    if (stats.length === 0) return;

    const playerIds = stats.map((stat) => stat.playerId);

    // Query to get all teams a player has played for in the relevant time period
    let whereClause = '';
    const params: (bigint | number)[] = [];

    if (filters.leagueId && filters.leagueId !== BigInt(0)) {
      if (filters.isHistorical) {
        // For all-time stats, filter by league.id
        whereClause += ' AND ls.leagueid = $' + (params.length + 1);
      } else {
        // For season stats, filter by leagueseason.id
        whereClause += ' AND ls.id = $' + (params.length + 1);
      }
      params.push(filters.leagueId);
    }

    if (filters.teamId && filters.teamId !== BigInt(0)) {
      whereClause +=
        ' AND (bs.teamid = $' +
        (params.length + 1) +
        ' OR ps.teamid = $' +
        (params.length + 1) +
        ')';
      params.push(filters.teamId);
    }

    // Convert playerIds to a string for IN clause
    const playerIdStrings = playerIds.map((id) => id.toString()).join(',');

    const teamQuery = `
      SELECT DISTINCT
        c.id as "playerId",
        t.id as "teamId",
        ts.name as "teamName"
      FROM contacts c
      LEFT JOIN roster r ON c.id = r.contactid
      LEFT JOIN rosterseason rs ON r.id = rs.playerid
      LEFT JOIN batstatsum bs ON rs.id = bs.playerid
      LEFT JOIN pitchstatsum ps ON rs.id = ps.playerid
      LEFT JOIN teamsseason ts ON (bs.teamid = ts.id OR ps.teamid = ts.id)
      LEFT JOIN teams t ON ts.teamid = t.id
      LEFT JOIN leagueseason ls ON ts.leagueseasonid = ls.id
      LEFT JOIN leagueschedule lg ON (bs.gameid = lg.id OR ps.gameid = lg.id)
      WHERE c.id IN (${playerIdStrings})
        AND ${filters.includeAllGameTypes ? `lg.gametype IN (${GameType.RegularSeason}, ${GameType.Playoff})` : `lg.gametype = ${GameType.RegularSeason}`}
        AND (bs.playerid IS NOT NULL OR ps.playerid IS NOT NULL)
        ${whereClause}
      ORDER BY c.id, t.id, ts.name
    `;

    const teamResults = await this.prisma.$queryRawUnsafe(teamQuery, ...params);
    const teamsByPlayer = new Map<string, string[]>();
    const teamIdsByPlayer = new Map<string, Set<string>>();

    // Group teams by player, deduplicating by teamId
    for (const row of teamResults as Array<{
      playerId: bigint;
      teamId?: bigint;
      teamName?: string;
    }>) {
      const playerId = row.playerId.toString();
      const teamId = row.teamId?.toString();

      if (!teamsByPlayer.has(playerId)) {
        teamsByPlayer.set(playerId, []);
        teamIdsByPlayer.set(playerId, new Set());
      }

      // Only add team if we haven't seen this teamId for this player
      if (row.teamName && teamId && !teamIdsByPlayer.get(playerId)!.has(teamId)) {
        teamsByPlayer.get(playerId)!.push(row.teamName);
        teamIdsByPlayer.get(playerId)!.add(teamId);
      }
    }

    // Add team information to each stat
    for (const stat of stats) {
      const playerId = stat.playerId.toString();
      const teams = teamsByPlayer.get(playerId) || [];
      stat.teams = teams;
      stat.teamName = teams.length > 1 ? teams.join(', ') : teams[0] || 'Unknown';
    }
  }

  // Get pitching statistics with pagination and filtering
  async getPitchingStats(
    _accountId: bigint,
    filters: PitchingStatisticsFiltersType,
  ): Promise<PitchingStatsRow[]> {
    const {
      leagueId,
      divisionId,
      teamId,
      isHistorical = false,
      sortField,
      sortOrder = 'asc', // ERA is better when lower
      page = 1,
      pageSize = 50,
      minIP = isHistorical ? 100 : 20,
      includeAllGameTypes = false,
    } = filters;

    const offset = (page - 1) * pageSize;

    let whereClause = '';
    const params: (bigint | number)[] = [];

    if (leagueId && leagueId !== BigInt(0)) {
      if (isHistorical) {
        // For all-time stats, filter by league.id (not leagueseason.id)
        whereClause += ' AND ls.leagueid = $' + (params.length + 1);
      } else {
        // For season stats, filter by leagueseason.id
        whereClause += ' AND ls.id = $' + (params.length + 1);
      }
      params.push(leagueId);
    }

    if (divisionId && divisionId !== BigInt(0)) {
      whereClause += ' AND ts.divisionseasonid = $' + (params.length + 1);
      params.push(divisionId);
    }

    if (teamId && teamId !== BigInt(0)) {
      whereClause += ' AND ps.teamid = $' + (params.length + 1);
      params.push(teamId);
    }

    // For rate stats, add minimum IP requirement if specified
    const havingClause = minIP > 0 ? `HAVING (SUM(ps.ip) + SUM(ps.ip2) / 3.0) >= ${minIP}` : '';

    if (!sortField) {
      throw new Error('Sort field is required');
    }

    const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
    // Special case for innings pitched which uses decimal calculation
    const sortFieldSql = sortField.toLowerCase() === 'ip' ? '"ipDecimal"' : sortField.toLowerCase();

    // Conditionally include teamsseason JOIN only if filtering by division
    const teamJoin =
      divisionId && divisionId !== BigInt(0) ? 'LEFT JOIN teamsseason ts ON ps.teamid = ts.id' : '';

    const query = `
      SELECT 
        c.id as "playerId",
        CONCAT(c.firstname, ' ', c.lastname) as "playerName",
        SUM(ps.ip)::int as ip,
        SUM(ps.ip2)::int as ip2,
        SUM(ps.w)::int as w,
        SUM(ps.l)::int as l,
        SUM(ps.s)::int as s,
        SUM(ps.h)::int as h,
        SUM(ps.r)::int as r,
        SUM(ps.er)::int as er,
        SUM(ps.bb)::int as bb,
        SUM(ps.so)::int as so,
        SUM(ps.hr)::int as hr,
        SUM(ps.bf)::int as bf,
        SUM(ps.wp)::int as wp,
        SUM(ps.hbp)::int as hbp,
        -- Calculated fields
        CASE WHEN (SUM(ps.ip) + SUM(ps.ip2) / 3.0) = 0 THEN 0 
             ELSE (SUM(ps.er) * 9.0)::float / (SUM(ps.ip) + SUM(ps.ip2) / 3.0) 
        END as era,
        CASE WHEN (SUM(ps.ip) + SUM(ps.ip2) / 3.0) = 0 THEN 0 
             ELSE (SUM(ps.bb) + SUM(ps.h))::float / (SUM(ps.ip) + SUM(ps.ip2) / 3.0) 
        END as whip,
        CASE WHEN (SUM(ps.ip) + SUM(ps.ip2) / 3.0) = 0 THEN 0 
             ELSE (SUM(ps.so)::float / (SUM(ps.ip) + SUM(ps.ip2) / 3.0)) * 9.0 
        END as k9,
        CASE WHEN (SUM(ps.ip) + SUM(ps.ip2) / 3.0) = 0 THEN 0 
             ELSE (SUM(ps.bb)::float / (SUM(ps.ip) + SUM(ps.ip2) / 3.0)) * 9.0 
        END as bb9,
        CASE WHEN (SUM(ps.bf) - SUM(ps.bb) - SUM(ps.hbp)) = 0 THEN 0 
             ELSE SUM(ps.h)::float / (SUM(ps.bf) - SUM(ps.bb) - SUM(ps.hbp)) 
        END as oba,
        CASE WHEN (SUM(ps.bf) - SUM(ps.bb) - SUM(ps.hbp)) = 0 THEN 0 
             ELSE (SUM(ps.d) * 2 + SUM(ps.t) * 3 + SUM(ps.hr) * 4 + (SUM(ps.h) - SUM(ps.d) - SUM(ps.t) - SUM(ps.hr)))::float / (SUM(ps.bf) - SUM(ps.bb) - SUM(ps.hbp)) 
        END as slg,
        (SUM(ps.ip) + SUM(ps.ip2) / 3.0)::float as "ipDecimal"
      FROM pitchstatsum ps
      LEFT JOIN rosterseason rs ON ps.playerid = rs.id
      LEFT JOIN roster r ON rs.playerid = r.id
      LEFT JOIN contacts c ON r.contactid = c.id
      LEFT JOIN leagueschedule lg ON ps.gameid = lg.id
      LEFT JOIN leagueseason ls ON lg.leagueid = ls.id
      ${teamJoin}
      WHERE ${includeAllGameTypes ? `lg.gametype IN (${GameType.RegularSeason}, ${GameType.Playoff})` : `lg.gametype = ${GameType.RegularSeason}`}
        ${whereClause}
      GROUP BY c.id, c.firstname, c.lastname
      ${havingClause}
      ORDER BY ${sortFieldSql} ${orderDirection}
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const result = await this.prisma.$queryRawUnsafe(query, ...params);
    const pitchingStats = result as PitchingStatsRow[];

    // Fetch teams for each player
    await this.addTeamsToStats(pitchingStats, filters);

    return pitchingStats;
  }

  // Get statistical leaders for a category
  async getLeaders(
    accountId: bigint,
    category: string,
    filters: LeaderStatisticsFiltersType,
  ): Promise<LeaderRow[]> {
    // Check the database to determine if this is a batting or pitching stat
    const categoryConfig = await this.prisma.displayleagueleaders.findFirst({
      where: {
        accountid: accountId,
        fieldname: {
          equals: category.toLowerCase(),
          mode: 'insensitive',
        },
      },
      select: {
        isbatleader: true,
      },
    });

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

    if (isBattingStat) {
      return this.getBattingLeaders(accountId, category, updatedFilters);
    } else {
      return this.getPitchingLeaders(accountId, category, updatedFilters);
    }
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
    accountId: bigint,
    category: string,
    filters: LeaderStatisticsFiltersType,
  ): Promise<LeaderRow[]> {
    const sortOrder = this.getBattingSortOrder(category);
    const stats = await this.getBattingStats(accountId, {
      ...filters,
      sortField: category,
      sortOrder,
    });

    return this.processLeadersWithTies(stats, category, filters.limit, (stat) =>
      this.getStatValue(stat, category),
    );
  }

  private async getPitchingLeaders(
    accountId: bigint,
    category: string,
    filters: LeaderStatisticsFiltersType,
  ): Promise<LeaderRow[]> {
    const sortOrder = this.getPitchingSortOrder(category);
    const stats = await this.getPitchingStats(accountId, {
      ...filters,
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
    T extends { playerId: bigint; playerName: string; teamName: string },
  >(stats: T[], category: string, limit: number, getStatValue: (stat: T) => number): LeaderRow[] {
    const result: LeaderRow[] = [];
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
          result.push({
            playerId: player.playerId,
            playerName: player.playerName,
            teamName: player.teamName,
            statValue: value,
            category,
            rank: currentRank,
          });
        }
        currentRank += playersWithValue.length;
      } else if (result.length < limit) {
        // We have space but not enough for all tied players, show tie indicator
        result.push({
          playerId: BigInt(0), // Indicates this is a tie entry
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

  private getStatValue(stat: BattingStatsRow, category: string): number {
    const categoryMap: { [key: string]: keyof BattingStatsRow } = {
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

  private getPitchingStatValue(stat: PitchingStatsRow, category: string): number {
    const categoryMap: { [key: string]: keyof PitchingStatsRow } = {
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

  private getStatFormat(fieldname: string): string {
    const rateStats = ['avg', 'obp', 'slg', 'ops', 'era', 'whip'];
    const eraStats = ['era'];
    const ipStats = ['ip'];

    if (eraStats.includes(fieldname.toLowerCase())) {
      return 'era';
    } else if (rateStats.includes(fieldname.toLowerCase())) {
      return 'average';
    } else if (ipStats.includes(fieldname.toLowerCase())) {
      return 'innings';
    } else {
      return 'number';
    }
  }

  private getStatLabel(fieldname: string): string {
    const labelMap: { [key: string]: string } = {
      avg: 'Batting Average',
      obp: 'On-Base Percentage',
      slg: 'Slugging Percentage',
      ops: 'OPS',
      hr: 'Home Runs',
      rbi: 'RBIs',
      h: 'Hits',
      r: 'Runs',
      bb: 'Walks',
      so: 'Strikeouts',
      sb: 'Stolen Bases',
      era: 'ERA',
      whip: 'WHIP',
      w: 'Wins',
      l: 'Losses',
      s: 'Saves',
      k9: 'K/9',
      bb9: 'BB/9',
    };
    return labelMap[fieldname.toLowerCase()] || fieldname.toUpperCase();
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
