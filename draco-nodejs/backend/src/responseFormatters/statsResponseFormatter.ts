import {
  GameStatusEnumType,
  GameStatusShortEnumType,
  GameType as GameTypeShared,
  PlayerBattingStatsBriefType,
  PlayerPitchingStatsBriefType,
  RecentGamesType,
} from '@draco/shared-schemas';
import { dbGameInfo } from '../repositories/index.js';
import { DateUtils } from '../utils/dateUtils.js';
import { getGameStatusShortText, getGameStatusText } from '@/utils/gameStatus.js';

export class StatsResponseFormatter {
  static formatGameInfoResponse(game: dbGameInfo): GameTypeShared {
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
      field: game.fieldid
        ? {
            id: game.fieldid.toString(),
            name: game.availablefields?.name || '',
            shortName: game.availablefields?.shortname || '',
          }
        : undefined,
      hasGameRecap: Boolean(game._count?.gamerecap),
      gameType: game.gametype.toString(),
    };
  }

  /*
      gameStatusText: 
      gameStatusShortText: g,
      
  */

  static formatGameResponse(game: dbGameInfo): GameTypeShared {
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
        name: game.leagueseason?.name || '',
      },
      homeScore: game.hscore || 0,
      visitorScore: game.vscore || 0,
      gameStatus: game.gamestatus || 0,
      gameStatusText: getGameStatusText(game.gamestatus) as GameStatusEnumType,
      gameStatusShortText: getGameStatusShortText(game.gamestatus) as GameStatusShortEnumType,
      field: game.fieldid
        ? {
            id: game.fieldid.toString(),
            name: game.availablefields?.name || '',
            shortName: game.availablefields?.shortname || '',
          }
        : undefined,
      hasGameRecap: Boolean(game._count?.gamerecap),
      gameType: game.gametype.toString(),
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
}
