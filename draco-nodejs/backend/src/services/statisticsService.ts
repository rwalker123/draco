import { PrismaClient } from '@prisma/client';
import { MinimumCalculator } from './minimumCalculator';

export interface BattingStatsRow {
  playerId: bigint;
  playerName: string;
  teamName: string;
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
  [key: string]: string | number | bigint;
}

export interface PitchingStatsRow {
  playerId: bigint;
  playerName: string;
  teamName: string;
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
  [key: string]: string | number | bigint;
}

export interface LeaderRow {
  playerId: bigint;
  playerName: string;
  teamName: string;
  statValue: number;
  category: string;
  rank: number;
  isTie?: boolean;
  tieCount?: number;
  [key: string]: string | number | bigint | boolean | undefined;
}

export interface StandingsRow {
  teamName: string;
  teamId: bigint;
  w: number;
  l: number;
  pct: number;
  gb: number; // games back
  streak: string;
  last10: string;
  [key: string]: string | number | bigint;
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
}

export class StatisticsService {
  private prisma: PrismaClient;
  private minimumCalculator: MinimumCalculator;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.minimumCalculator = new MinimumCalculator(prisma);
  }

  // Get configured leader categories for an account
  async getLeaderCategories(accountId: bigint) {
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
  async getBattingStats(accountId: bigint, filters: StatisticsFilters): Promise<BattingStatsRow[]> {
    const {
      leagueId,
      divisionId,
      isHistorical = false,
      sortField,
      sortOrder = 'desc',
      page = 1,
      pageSize = 50,
      minAB = isHistorical ? 150 : 30,
    } = filters;

    const offset = (page - 1) * pageSize;

    // Build the base query
    let whereClause = '';
    const params: (bigint | number)[] = [];

    if (leagueId && leagueId !== BigInt(0)) {
      whereClause += ' AND ls.id = $' + (params.length + 1);
      params.push(leagueId);
    }

    if (divisionId && divisionId !== BigInt(0)) {
      whereClause += ' AND ts.divisionseasonid = $' + (params.length + 1);
      params.push(divisionId);
    }

    // For rate stats, add minimum AB requirement if specified
    const havingClause = minAB > 0 ? `HAVING SUM(bs.ab) >= ${minAB}` : '';

    if (!sortField) {
      throw new Error('Sort field is required');
    }

    const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const sortFieldSql = sortField.toLowerCase();

    const query = `
      SELECT 
        bs.playerid as "playerId",
        CONCAT(c.firstname, ' ', c.lastname) as "playerName",
        ts.name as "teamName",
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
      LEFT JOIN teamsseason ts ON bs.teamid = ts.id
      LEFT JOIN leagueseason ls ON ts.leagueseasonid = ls.id
      LEFT JOIN season s ON ls.seasonid = s.id
      LEFT JOIN leagueschedule lg ON bs.gameid = lg.id
      WHERE lg.gametype = 0
        ${whereClause}
      GROUP BY bs.playerid, c.firstname, c.lastname, ts.name
      ${havingClause}
      ORDER BY ${sortFieldSql} ${orderDirection}
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const result = await this.prisma.$queryRawUnsafe(query, ...params);
    return result as BattingStatsRow[];
  }

  // Get pitching statistics with pagination and filtering
  async getPitchingStats(
    accountId: bigint,
    filters: StatisticsFilters,
  ): Promise<PitchingStatsRow[]> {
    const {
      leagueId,
      divisionId,
      isHistorical = false,
      sortField,
      sortOrder = 'asc', // ERA is better when lower
      page = 1,
      pageSize = 50,
      minIP = isHistorical ? 100 : 20,
    } = filters;

    const offset = (page - 1) * pageSize;

    let whereClause = '';
    const params: (bigint | number)[] = [];

    if (leagueId && leagueId !== BigInt(0)) {
      whereClause += ' AND ls.id = $' + (params.length + 1);
      params.push(leagueId);
    }

    if (divisionId && divisionId !== BigInt(0)) {
      whereClause += ' AND ts.divisionseasonid = $' + (params.length + 1);
      params.push(divisionId);
    }

    // For rate stats, add minimum IP requirement if specified
    const havingClause = minIP > 0 ? `HAVING (SUM(ps.ip) + SUM(ps.ip2) / 3.0) >= ${minIP}` : '';

    if (!sortField) {
      throw new Error('Sort field is required');
    }

    const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
    // Special case for innings pitched which uses decimal calculation
    const sortFieldSql = sortField.toLowerCase() === 'ip' ? '"ipDecimal"' : sortField.toLowerCase();

    const query = `
      SELECT 
        ps.playerid as "playerId",
        CONCAT(c.firstname, ' ', c.lastname) as "playerName",
        ts.name as "teamName",
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
      LEFT JOIN teamsseason ts ON ps.teamid = ts.id
      LEFT JOIN leagueseason ls ON ts.leagueseasonid = ls.id
      LEFT JOIN season s ON ls.seasonid = s.id
      LEFT JOIN leagueschedule lg ON ps.gameid = lg.id
      WHERE lg.gametype = 0
        ${whereClause}
      GROUP BY ps.playerid, c.firstname, c.lastname, ts.name
      ${havingClause}
      ORDER BY ${sortFieldSql} ${orderDirection}
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const result = await this.prisma.$queryRawUnsafe(query, ...params);
    return result as PitchingStatsRow[];
  }

  // Get statistical leaders for a category
  async getLeaders(
    accountId: bigint,
    category: string,
    filters: StatisticsFilters,
    limit: number = 5,
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
    const queryLimit = Math.max(50, limit * 10);
    const updatedFilters = {
      ...filters,
      pageSize: queryLimit,
      minAB: Math.max(minAB, filters.minAB || 0),
      minIP: Math.max(minIP, filters.minIP || 0),
    };

    if (isBattingStat) {
      return this.getBattingLeaders(accountId, category, updatedFilters, limit);
    } else {
      return this.getPitchingLeaders(accountId, category, updatedFilters, limit);
    }
  }

  // Get standings for a season
  async getStandings(accountId: bigint, seasonId: bigint): Promise<StandingsRow[]> {
    // This is a complex calculation involving win/loss records
    // For now, returning a placeholder structure
    const query = `
      SELECT 
        ts.name as "teamName",
        t.id as "teamId",
        COALESCE(SUM(CASE 
          WHEN (lg.hteamid = ts.id AND lg.hscore > lg.vscore) OR (lg.vteamid = ts.id AND lg.vscore > lg.hscore) 
          THEN 1 ELSE 0 END), 0)::int as w,
        COALESCE(SUM(CASE 
          WHEN (lg.hteamid = ts.id AND lg.hscore < lg.vscore) OR (lg.vteamid = ts.id AND lg.vscore < lg.hscore) 
          THEN 1 ELSE 0 END), 0)::int as l,
        CASE WHEN (SUM(CASE 
          WHEN (lg.hteamid = ts.id AND lg.hscore > lg.vscore) OR (lg.vteamid = ts.id AND lg.vscore > lg.hscore) 
          THEN 1 ELSE 0 END) + SUM(CASE 
          WHEN (lg.hteamid = ts.id AND lg.hscore < lg.vscore) OR (lg.vteamid = ts.id AND lg.vscore < lg.hscore) 
          THEN 1 ELSE 0 END)) = 0 
             THEN 0 
             ELSE ROUND(SUM(CASE 
               WHEN (lg.hteamid = ts.id AND lg.hscore > lg.vscore) OR (lg.vteamid = ts.id AND lg.vscore > lg.hscore) 
               THEN 1 ELSE 0 END)::decimal / 
                       (SUM(CASE 
                         WHEN (lg.hteamid = ts.id AND lg.hscore > lg.vscore) OR (lg.vteamid = ts.id AND lg.vscore > lg.hscore) 
                         THEN 1 ELSE 0 END) + SUM(CASE 
                         WHEN (lg.hteamid = ts.id AND lg.hscore < lg.vscore) OR (lg.vteamid = ts.id AND lg.vscore < lg.hscore) 
                         THEN 1 ELSE 0 END)), 3) 
        END as pct,
        0 as gb, -- Games back calculation would be more complex
        '' as streak, -- Streak calculation would require game order analysis
        '' as "last10" -- Last 10 games calculation
      FROM teams t
      INNER JOIN teamsseason ts ON t.id = ts.teamid
      INNER JOIN leagueseason ls ON ts.leagueseasonid = ls.id
      LEFT JOIN leagueschedule lg ON (lg.hteamid = ts.id OR lg.vteamid = ts.id) 
        AND lg.gamestatus IN (1, 4, 5)
        AND lg.leagueid = ls.id
      WHERE ls.seasonid = $1
        AND t.accountid = $2
      GROUP BY t.id, ts.name
      ORDER BY pct DESC, w DESC
    `;

    const result = await this.prisma.$queryRawUnsafe(query, seasonId, accountId);
    return result as StandingsRow[];
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
    filters: StatisticsFilters,
    limit: number,
  ): Promise<LeaderRow[]> {
    const sortOrder = this.getBattingSortOrder(category);
    const stats = await this.getBattingStats(accountId, {
      ...filters,
      sortField: category,
      sortOrder,
    });

    return this.processLeadersWithTies(stats, category, limit, (stat) =>
      this.getStatValue(stat, category),
    );
  }

  private async getPitchingLeaders(
    accountId: bigint,
    category: string,
    filters: StatisticsFilters,
    limit: number,
  ): Promise<LeaderRow[]> {
    const sortOrder = this.getPitchingSortOrder(category);
    const stats = await this.getPitchingStats(accountId, {
      ...filters,
      sortField: category,
      sortOrder,
    });

    return this.processLeadersWithTies(stats, category, limit, (stat) =>
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
