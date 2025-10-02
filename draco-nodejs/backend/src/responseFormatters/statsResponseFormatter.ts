import { BattingStat, GameInfo, PitchingStat } from '@/services/teamStatsService.js';
import {
  GameStatusEnumType,
  GameStatusShortEnumType,
  GameType as GameTypeShared,
  PlayerBattingStatsBriefType,
  PlayerPitchingStatsBriefType,
  RecentGamesType,
} from '@draco/shared-schemas';
import { dbGameInfo } from '@/repositories/index.js';
import { DateUtils } from '@/utils/dateUtils.js';

export class StatsResponseFormatter {
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
}
