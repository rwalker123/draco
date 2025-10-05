import { BattingStat, GameInfo, PitchingStat } from '../services/teamStatsService.js';
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
    return {
      id: game.id.toString(),
      gameDate: DateUtils.formatDateTimeForResponse(game.gamedate) || '',
      homeTeam: {
        id: game.hteamid.toString(),
        name: '', // Name not available in dbGameInfo
      },
      visitorTeam: {
        id: game.vteamid.toString(),
        name: '', // Name not available in dbGameInfo
      },
      league: {
        id: game.leagueid.toString(),
        name: '', // Name not available in dbGameInfo
      },
      homeScore: game.hscore,
      visitorScore: game.vscore,
      gameStatus: game.gamestatus,
      field: game.fieldid
        ? {
            id: game.fieldid.toString(),
            name: game.availablefields?.name || '',
            shortName: game.availablefields?.shortname || '',
          }
        : undefined,
      hasGameRecap: undefined,
      gameType: game.gametype.toString(),
    };
  }

  static formatGameResponse(game: GameInfo): GameTypeShared {
    return {
      id: game.id,
      gameDate: game.date ?? '',
      homeTeam: {
        id: game.homeTeamId || '',
        name: game.homeTeamName,
      },
      visitorTeam: {
        id: game.awayTeamId || '',
        name: game.awayTeamName,
      },
      league: {
        id: '', // League ID is not available in GameInfo
        name: game.leagueName,
      },
      homeScore: game.homeScore || 0,
      visitorScore: game.awayScore || 0,
      gameStatus: game.gameStatus || 0,
      gameStatusText: game.gameStatusText as GameStatusEnumType,
      gameStatusShortText: game.gameStatusShortText as GameStatusShortEnumType,
      field: game.fieldId
        ? {
            id: game.fieldId,
            name: game.fieldName || '',
            shortName: game.fieldShortName || '',
          }
        : undefined,
      hasGameRecap: game.hasGameRecap,
      gameType: game.gameType?.toString() || '0',
    };
  }

  static formatTeamGamesResponse(gamesData: {
    upcoming?: GameInfo[];
    recent?: GameInfo[];
  }): RecentGamesType {
    return {
      upcoming:
        gamesData.upcoming?.map((game) => StatsResponseFormatter.formatGameResponse(game)) ?? [],

      recent:
        gamesData.recent?.map((game) => StatsResponseFormatter.formatGameResponse(game)) ?? [],
    };
  }

  static formatBattingStatsResponse(battingStats: BattingStat[]): PlayerBattingStatsBriefType[] {
    return battingStats.map((stat) => ({
      playerId: stat.playerId,
      playerName: stat.playerName,
      ab: stat.atBats,
      h: stat.hits,
      d: stat.doubles,
      t: stat.triples,
      hr: stat.homeRuns,
      rbi: stat.rbis,
      r: stat.runs,
      bb: stat.walks,
      so: stat.strikeouts,
      avg: stat.avg,
      obp: stat.obp,
      slg: stat.slg,
      ops: stat.ops,
    }));
  }

  static formatPitchingStatsResponse(
    pitchingStats: PitchingStat[],
  ): PlayerPitchingStatsBriefType[] {
    return pitchingStats.map((stat) => ({
      playerId: stat.playerId,
      playerName: stat.playerName,
      ip: stat.inningsPitched,
      w: stat.wins,
      l: stat.losses,
      s: stat.saves,
      h: stat.hits,
      r: stat.runs,
      er: stat.earnedRuns,
      bb: stat.walks,
      so: stat.strikeouts,
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
