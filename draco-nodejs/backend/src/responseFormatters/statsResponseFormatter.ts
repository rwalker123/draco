import {
  GameStatusEnumType,
  GameStatusShortEnumType,
  GameType as GameTypeShared,
  LeaderCategoriesType,
  LeaderRowType,
  PlayerBattingStatsBriefType,
  PlayerBattingStatsType,
  PlayerPitchingStatsBriefType,
  PlayerPitchingStatsType,
  RecentGamesType,
} from '@draco/shared-schemas';
import { dbGameInfo } from '../repositories/index.js';
import {
  dbBattingStatisticsRow,
  dbLeaderCategoryConfig,
  dbPitchingStatisticsRow,
} from '../repositories/types/dbTypes.js';
import { DateUtils } from '../utils/dateUtils.js';
import { getGameStatusShortText, getGameStatusText } from '../utils/gameStatus.js';
import { formatFieldFromAvailableField } from './fieldFormatterUtils.js';

export class StatsResponseFormatter {
  static formatLeaderCategories(categories: dbLeaderCategoryConfig[]): LeaderCategoriesType {
    const batting = [];
    const pitching = [];

    for (const category of categories) {
      const formatted = {
        key: category.fieldname,
        label: StatsResponseFormatter.getStatLabel(category.fieldname),
        format: StatsResponseFormatter.getStatFormat(category.fieldname),
      };

      if (category.isbatleader) {
        batting.push(formatted);
      } else {
        pitching.push(formatted);
      }
    }

    return { batting, pitching };
  }

  static formatPlayerBattingStats(stats: dbBattingStatisticsRow[]): PlayerBattingStatsType[] {
    return stats.map((stat) => {
      const teams = stat.teams?.length ? stat.teams : undefined;
      const formatted = {
        playerId: stat.playerId.toString(),
        playerName: stat.playerName,
        teamName: StatsResponseFormatter.resolveTeamName(stat.teamName, teams),
        ab: stat.ab,
        h: stat.h,
        r: stat.r,
        d: stat.d,
        t: stat.t,
        hr: stat.hr,
        rbi: stat.rbi,
        bb: stat.bb,
        so: stat.so,
        hbp: stat.hbp,
        sb: stat.sb,
        sf: stat.sf,
        sh: stat.sh,
        avg: stat.avg,
        obp: stat.obp,
        slg: stat.slg,
        ops: stat.ops,
        tb: stat.tb,
        pa: stat.pa,
        teams: teams,
      } satisfies PlayerBattingStatsType;

      return formatted;
    });
  }

  static formatPlayerPitchingStats(stats: dbPitchingStatisticsRow[]): PlayerPitchingStatsType[] {
    return stats.map((stat) => {
      const teams = stat.teams?.length ? stat.teams : undefined;
      const formatted = {
        playerId: stat.playerId.toString(),
        playerName: stat.playerName,
        teamName: StatsResponseFormatter.resolveTeamName(stat.teamName, teams),
        ip: stat.ip,
        ip2: stat.ip2,
        w: stat.w,
        l: stat.l,
        s: stat.s,
        h: stat.h,
        r: stat.r,
        er: stat.er,
        bb: stat.bb,
        so: stat.so,
        hr: stat.hr,
        bf: stat.bf,
        wp: stat.wp,
        hbp: stat.hbp,
        era: stat.era,
        whip: stat.whip,
        k9: stat.k9,
        bb9: stat.bb9,
        oba: stat.oba,
        slg: stat.slg,
        ipDecimal: stat.ipDecimal,
        teams: teams,
      } satisfies PlayerPitchingStatsType;

      return formatted;
    });
  }

  static formatLeaderRows(rows: LeaderRowType[]): LeaderRowType[] {
    return rows.map((row) => {
      const teams = row.teams?.length ? row.teams : undefined;
      const teamName = row.isTie
        ? row.teamName
        : StatsResponseFormatter.resolveTeamName(row.teamName, teams);

      const formatted: LeaderRowType = {
        playerId: row.playerId,
        playerName: row.playerName,
        teamName,
        statValue: row.statValue,
        category: row.category,
        rank: row.rank,
      };

      if (teams) {
        formatted.teams = teams;
      }

      if (row.isTie) {
        formatted.isTie = true;
      }

      if (row.tieCount !== undefined) {
        formatted.tieCount = row.tieCount;
      }

      return formatted;
    });
  }

  static formatGameInfoResponse(game: dbGameInfo): GameTypeShared {
    const field = game.fieldid
      ? formatFieldFromAvailableField(
          game.availablefields ?? {
            id: game.fieldid,
            name: '',
            shortname: '',
          },
        )
      : undefined;

    return {
      id: game.id.toString(),
      gameDate: DateUtils.formatDateTimeForResponse(game.gamedate) || '',
      homeTeam: {
        id: game.hteamid.toString(),
        name: game.hometeam?.name || '',
      },
      visitorTeam: {
        id: game.vteamid.toString(),
        name: game.visitingteam?.name || '',
      },
      league: {
        id: game.leagueid.toString(),
        name: game.leagueseason?.league?.name || '',
      },
      homeScore: game.hscore,
      visitorScore: game.vscore,
      gameStatus: game.gamestatus,
      field,
      hasGameRecap: Boolean(game._count?.gamerecap),
      gameType: game.gametype,
    };
  }

  /*
      gameStatusText: 
      gameStatusShortText: g,
      
  */

  static formatGameResponse(game: dbGameInfo): GameTypeShared {
    const field = game.fieldid
      ? formatFieldFromAvailableField(
          game.availablefields ?? {
            id: game.fieldid,
            name: '',
            shortname: '',
          },
        )
      : undefined;

    return {
      id: game.id.toString(),
      gameDate: DateUtils.formatDateTimeForResponse(game.gamedate) || '',
      homeTeam: {
        id: game.hteamid.toString(),
        name: game.hometeam?.name || '',
      },
      visitorTeam: {
        id: game.vteamid.toString(),
        name: game.visitingteam?.name || '',
      },
      league: {
        id: game.leagueid.toString(),
        name: game.leagueseason?.league.name || '',
      },
      homeScore: game.hscore || 0,
      visitorScore: game.vscore || 0,
      gameStatus: game.gamestatus || 0,
      gameStatusText: getGameStatusText(game.gamestatus) as GameStatusEnumType,
      gameStatusShortText: getGameStatusShortText(game.gamestatus) as GameStatusShortEnumType,
      field,
      hasGameRecap: Boolean(game._count?.gamerecap),
      gameType: game.gametype,
    };
  }

  static formatTeamGamesResponse(gamesData: {
    upcoming?: dbGameInfo[];
    recent?: dbGameInfo[];
  }): RecentGamesType {
    return {
      upcoming:
        gamesData.upcoming?.map((game) => StatsResponseFormatter.formatGameResponse(game)) ?? [],

      recent:
        gamesData.recent?.map((game) => StatsResponseFormatter.formatGameResponse(game)) ?? [],
    };
  }

  static formatBattingStatsResponse(
    battingStats: dbBattingStatisticsRow[],
  ): PlayerBattingStatsBriefType[] {
    return battingStats.map((stat) => ({
      playerId: stat.playerId.toString(),
      playerName: stat.playerName,
      ab: stat.ab,
      h: stat.h,
      d: stat.d,
      t: stat.t,
      hr: stat.hr,
      rbi: stat.rbi,
      r: stat.r,
      bb: stat.bb,
      so: stat.so,
      avg: stat.avg,
      obp: stat.obp,
      slg: stat.slg,
      ops: stat.ops,
    }));
  }

  static formatPitchingStatsResponse(
    pitchingStats: dbPitchingStatisticsRow[],
  ): PlayerPitchingStatsBriefType[] {
    return pitchingStats.map((stat) => ({
      playerId: stat.playerId.toString(),
      playerName: stat.playerName,
      ip: stat.ip.toString() + '.' + stat.ip2.toString(), // Use ip (string) for brief stats to preserve fractional innings
      w: stat.w,
      l: stat.l,
      s: stat.s,
      h: stat.h,
      r: stat.r,
      er: stat.er,
      bb: stat.bb,
      so: stat.so,
      era: stat.era,
      whip: stat.whip,
    }));
  }

  private static resolveTeamName(teamName?: string, teams?: string[]): string {
    if (teamName && teamName.trim().length > 0) {
      return teamName;
    }

    if (teams && teams.length > 0) {
      return teams.length > 1 ? teams.join(', ') : teams[0];
    }

    return 'Unknown';
  }

  private static getStatFormat(fieldname: string): string {
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

  private static getStatLabel(fieldname: string): string {
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
}
