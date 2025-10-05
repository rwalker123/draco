import { PrismaClient } from '@prisma/client';
import { GameType } from '../../types/gameEnums.js';
import {
  IPitchingStatisticsRepository,
  PitchingStatisticsQueryOptions,
} from '../interfaces/IPitchingStatisticsRepository.js';
import { PlayerTeamsQueryOptions } from '../interfaces/IBattingStatisticsRepository.js';
import { dbPitchingStatisticsRow, dbPlayerTeamAssignment } from '../types/dbTypes.js';

export class PrismaPitchingStatisticsRepository implements IPitchingStatisticsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findPitchingStatistics(
    query: PitchingStatisticsQueryOptions,
  ): Promise<dbPitchingStatisticsRow[]> {
    const {
      leagueId,
      divisionId,
      teamId,
      isHistorical,
      sortField,
      sortOrder,
      page,
      pageSize,
      minInningsPitched,
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
      whereClause += ' AND ps.teamid = $' + (params.length + 1);
      params.push(teamId);
    }

    const havingClause =
      minInningsPitched > 0 ? `HAVING (SUM(ps.ip) + SUM(ps.ip2) / 3.0) >= ${minInningsPitched}` : '';
    const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const sortFieldSql = sortField.toLowerCase() === 'ip' ? '"ipDecimal"' : sortField.toLowerCase();
    const teamJoin =
      divisionId && divisionId !== BigInt(0) ? 'LEFT JOIN teamsseason ts ON ps.teamid = ts.id' : '';

    const queryText = `
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

    const result = await this.prisma.$queryRawUnsafe(queryText, ...params);
    return result as dbPitchingStatisticsRow[];
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
    const params: (bigint | number)[] = [];

    if (leagueId && leagueId !== BigInt(0)) {
      if (isHistorical) {
        whereClause += ' AND ls.leagueid = $' + (params.length + 1);
      } else {
        whereClause += ' AND ls.id = $' + (params.length + 1);
      }
      params.push(leagueId);
    }

    if (teamId && teamId !== BigInt(0)) {
      whereClause += ' AND ps.teamid = $' + (params.length + 1);
      params.push(teamId);
    }

    const playerIdStrings = playerIds.map((id) => id.toString()).join(',');
    if (!playerIdStrings) {
      return [];
    }

    const teamQuery = `
      SELECT DISTINCT
        c.id as "playerId",
        t.id as "teamId",
        ts.name as "teamName"
      FROM contacts c
      INNER JOIN roster r ON c.id = r.contactid
      INNER JOIN rosterseason rs ON r.id = rs.playerid
      INNER JOIN pitchstatsum ps ON rs.id = ps.playerid
      LEFT JOIN teamsseason ts ON ps.teamid = ts.id
      LEFT JOIN teams t ON ts.teamid = t.id
      LEFT JOIN leagueschedule lg ON ps.gameid = lg.id
      LEFT JOIN leagueseason ls ON lg.leagueid = ls.id
      WHERE c.id IN (${playerIdStrings})
        AND ${includeAllGameTypes ? `lg.gametype IN (${GameType.RegularSeason}, ${GameType.Playoff})` : `lg.gametype = ${GameType.RegularSeason}`}
        ${whereClause}
      ORDER BY c.id, t.id, ts.name
    `;

    const result = await this.prisma.$queryRawUnsafe(teamQuery, ...params);
    return result as dbPlayerTeamAssignment[];
  }
}
