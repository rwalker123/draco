import { PrismaClient } from '#prisma/client';
import { GameType } from '../../types/gameEnums.js';
import {
  BattingStatisticsQueryOptions,
  IBattingStatisticsRepository,
  PlayerTeamsQueryOptions,
} from '../interfaces/IBattingStatisticsRepository.js';
import {
  dbBattingStatisticsRow,
  dbPlayerTeamAssignment,
  dbPlayerCareerBattingRow,
} from '../types/dbTypes.js';

export class PrismaBattingStatisticsRepository implements IBattingStatisticsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findBattingStatistics(
    query: BattingStatisticsQueryOptions,
  ): Promise<dbBattingStatisticsRow[]> {
    const {
      leagueId,
      divisionId,
      teamId,
      isHistorical,
      sortField,
      sortOrder,
      page,
      pageSize,
      minAtBats,
      includeAllGameTypes,
    } = query;

    const offset = (page - 1) * pageSize;
    let whereClause = '';
    const params: (bigint | number)[] = [];

    if (leagueId && leagueId !== BigInt(0)) {
      if (isHistorical) {
        whereClause += ' AND ls.leagueid = $' + (params.length + 1);
      } else {
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

    const havingClause = minAtBats > 0 ? `HAVING SUM(bs.ab) >= ${minAtBats}` : '';
    const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const sortFieldMap: Record<string, string> = {
      playerid: '"playerId"',
      playername: '"playerName"',
      ab: 'ab',
      h: 'h',
      r: 'r',
      d: 'd',
      t: 't',
      hr: 'hr',
      rbi: 'rbi',
      bb: 'bb',
      so: 'so',
      hbp: 'hbp',
      sb: 'sb',
      sf: 'sf',
      sh: 'sh',
      avg: 'avg',
      obp: 'obp',
      slg: 'slg',
      ops: 'ops',
      tb: 'tb',
      pa: 'pa',
    };
    const normalizedSortField = sortField ? sortField.toLowerCase() : 'playername';
    const sortFieldSql = sortFieldMap[normalizedSortField] ?? '"playerName"';
    const teamJoin =
      divisionId && divisionId !== BigInt(0) ? 'LEFT JOIN teamsseason ts ON bs.teamid = ts.id' : '';

    const queryText = `
      SELECT
        c.id as "playerId",
        CONCAT(c.lastname, ', ', c.firstname) as "playerName",
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

    const result = await this.prisma.$queryRawUnsafe(queryText, ...params);
    return result as dbBattingStatisticsRow[];
  }

  async findTeamsForPlayers(
    playerIds: bigint[],
    query: PlayerTeamsQueryOptions,
  ): Promise<dbPlayerTeamAssignment[]> {
    if (playerIds.length === 0) {
      return [];
    }

    const { leagueId, teamId, isHistorical, includeAllGameTypes } = query;
    let whereClause = '';
    const params: (bigint | number | bigint[])[] = [];

    // Use parameterized query for player IDs to prevent SQL injection
    const playerIdParamIndex = params.length + 1;
    params.push(playerIds);

    if (leagueId && leagueId !== BigInt(0)) {
      if (isHistorical) {
        whereClause += ' AND ls.leagueid = $' + (params.length + 1);
      } else {
        whereClause += ' AND ls.id = $' + (params.length + 1);
      }
      params.push(leagueId);
    }

    if (teamId && teamId !== BigInt(0)) {
      whereClause += ' AND bs.teamid = $' + (params.length + 1);
      params.push(teamId);
    }

    const teamQuery = `
      SELECT DISTINCT
        c.id as "playerId",
        t.id as "teamId",
        ts.name as "teamName"
      FROM contacts c
      INNER JOIN roster r ON c.id = r.contactid
      INNER JOIN rosterseason rs ON r.id = rs.playerid
      INNER JOIN batstatsum bs ON rs.id = bs.playerid
      LEFT JOIN teamsseason ts ON bs.teamid = ts.id
      LEFT JOIN teams t ON ts.teamid = t.id
      LEFT JOIN leagueschedule lg ON bs.gameid = lg.id
      LEFT JOIN leagueseason ls ON lg.leagueid = ls.id
      WHERE c.id = ANY($${playerIdParamIndex}::bigint[])
        AND ${includeAllGameTypes ? `lg.gametype IN (${GameType.RegularSeason}, ${GameType.Playoff})` : `lg.gametype = ${GameType.RegularSeason}`}
        ${whereClause}
      ORDER BY c.id, t.id, ts.name
    `;

    const result = await this.prisma.$queryRawUnsafe(teamQuery, ...params);
    return result as dbPlayerTeamAssignment[];
  }

  async findPlayerCareerBattingStats(
    accountId: bigint,
    playerId: bigint,
  ): Promise<dbPlayerCareerBattingRow[]> {
    const query = `
      SELECT
        c.id AS "playerId",
        CONCAT(c.firstname, ' ', c.lastname) AS "playerName",
        ls.seasonid AS "seasonId",
        s.name AS "seasonName",
        NULL::timestamp AS "seasonStartDate",
        ls.leagueid AS "leagueId",
        l.name AS "leagueName",
        ts.id AS "teamSeasonId",
        ts.name AS "teamName",
        SUM(bs.ab)::int AS ab,
        SUM(bs.h)::int AS h,
        SUM(bs.r)::int AS r,
        SUM(bs.d)::int AS d,
        SUM(bs.t)::int AS t,
        SUM(bs.hr)::int AS hr,
        SUM(bs.rbi)::int AS rbi,
        SUM(bs.bb)::int AS bb,
        SUM(bs.so)::int AS so,
        SUM(bs.hbp)::int AS hbp,
        SUM(bs.sb)::int AS sb,
        SUM(bs.sf)::int AS sf,
        SUM(bs.sh)::int AS sh,
        CASE WHEN SUM(bs.ab) = 0 THEN 0 ELSE (SUM(bs.h)::float / SUM(bs.ab)) END AS avg,
        CASE
          WHEN (SUM(bs.ab) + SUM(bs.bb) + SUM(bs.hbp)) = 0 THEN 0
          ELSE ((SUM(bs.h) + SUM(bs.bb) + SUM(bs.hbp))::float / (SUM(bs.ab) + SUM(bs.bb) + SUM(bs.hbp)))
        END AS obp,
        CASE
          WHEN SUM(bs.ab) = 0 THEN 0
          ELSE ((SUM(bs.d) * 2 + SUM(bs.t) * 3 + SUM(bs.hr) * 4 + (SUM(bs.h) - SUM(bs.d) - SUM(bs.t) - SUM(bs.hr)))::float / SUM(bs.ab))
        END AS slg,
        (CASE
          WHEN SUM(bs.ab) = 0 THEN 0
          ELSE ((SUM(bs.d) * 2 + SUM(bs.t) * 3 + SUM(bs.hr) * 4 + (SUM(bs.h) - SUM(bs.d) - SUM(bs.t) - SUM(bs.hr)))::float / SUM(bs.ab))
        END +
        CASE
          WHEN (SUM(bs.ab) + SUM(bs.bb) + SUM(bs.hbp)) = 0 THEN 0
          ELSE ((SUM(bs.h) + SUM(bs.bb) + SUM(bs.hbp))::float / (SUM(bs.ab) + SUM(bs.bb) + SUM(bs.hbp)))
        END) AS ops,
        (SUM(bs.d) * 2 + SUM(bs.t) * 3 + SUM(bs.hr) * 4 + (SUM(bs.h) - SUM(bs.d) - SUM(bs.t) - SUM(bs.hr)))::int AS tb,
        (SUM(bs.ab) + SUM(bs.bb) + SUM(bs.hbp) + SUM(bs.sf) + SUM(bs.sh))::int AS pa
      FROM contacts c
      INNER JOIN roster r ON c.id = r.contactid
      INNER JOIN rosterseason rs ON r.id = rs.playerid
      INNER JOIN batstatsum bs ON rs.id = bs.playerid
      LEFT JOIN teamsseason ts ON bs.teamid = ts.id
      LEFT JOIN leagueschedule lg ON bs.gameid = lg.id
      LEFT JOIN leagueseason ls ON lg.leagueid = ls.id
      LEFT JOIN league l ON ls.leagueid = l.id
      LEFT JOIN season s ON ls.seasonid = s.id
      WHERE c.id = $1
        AND c.creatoraccountid = $2
        AND lg.id IS NOT NULL
        AND lg.gametype IN (${GameType.RegularSeason}, ${GameType.Playoff})
      GROUP BY
        c.id,
        c.firstname,
        c.lastname,
        ls.seasonid,
        s.name,
        ls.leagueid,
        l.name,
        ts.id,
        ts.name
      ORDER BY
        ls.seasonid DESC NULLS LAST,
        s.name NULLS LAST,
        l.name NULLS LAST,
        ts.name NULLS LAST
    `;

    const result = await this.prisma.$queryRawUnsafe(query, playerId, accountId);
    return result as dbPlayerCareerBattingRow[];
  }
}
