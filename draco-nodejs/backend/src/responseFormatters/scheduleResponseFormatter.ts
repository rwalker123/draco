import {
  GameResultType,
  GameType,
  GamesWithRecapsType,
  GameStatusEnumType,
  GameStatusShortEnumType,
} from '@draco/shared-schemas';
import { dbScheduleGameWithDetails, dbScheduleGameWithRecaps } from '../repositories/index.js';
import { DateUtils } from '../utils/dateUtils.js';
import { getGameStatusShortText, getGameStatusText } from '../utils/gameStatus.js';
import { collapseHtmlBlankLines } from '../utils/recapContent.js';
import { formatFieldFromAvailableField } from './fieldFormatterUtils.js';

export type ScheduleGameWithRecapsType = GamesWithRecapsType['games'][number];

interface FormatGameOptions {
  homeTeamName?: string;
  visitorTeamName?: string;
  hasRecap?: boolean;
  teamsWithStats?: string[];
}

function teamsWithStatsForGame(
  homeTeamId: string,
  visitorTeamId: string,
  statsMap?: Map<string, Set<string>>,
  gameId?: string,
): string[] | undefined {
  if (!statsMap || gameId === undefined) {
    return undefined;
  }
  const teams = statsMap.get(gameId);
  if (!teams || teams.size === 0) {
    return undefined;
  }
  return [homeTeamId, visitorTeamId].filter((id) => teams.has(id));
}

export class ScheduleResponseFormatter {
  static formatGameResult(game: dbScheduleGameWithDetails): GameResultType {
    return {
      id: game.id.toString(),
      homeScore: game.hscore,
      visitorScore: game.vscore,
      gameStatus: game.gamestatus,
    };
  }

  static formatGame(game: dbScheduleGameWithDetails, options: FormatGameOptions = {}): GameType {
    const baseGame: GameType = {
      id: game.id.toString(),
      gameDate: DateUtils.formatDateTimeForResponse(game.gamedate) || '',
      homeTeam: {
        id: game.hteamid.toString(),
        ...(options.homeTeamName ? { name: options.homeTeamName } : {}),
      },
      visitorTeam: {
        id: game.vteamid.toString(),
        ...(options.visitorTeamName ? { name: options.visitorTeamName } : {}),
      },
      league: {
        id: game.leagueseason.id.toString(),
        name: game.leagueseason.league.name,
      },
      season: game.leagueseason.season
        ? {
            id: game.leagueseason.season.id.toString(),
            name: game.leagueseason.season.name,
          }
        : undefined,
      homeScore: game.hscore,
      visitorScore: game.vscore,
      comment: game.comment ?? undefined,
      field: formatFieldFromAvailableField(game.availablefields),
      gameStatus: game.gamestatus,
      gameStatusText: getGameStatusText(game.gamestatus) as GameStatusEnumType,
      gameStatusShortText: getGameStatusShortText(game.gamestatus) as GameStatusShortEnumType,
      gameType: game.gametype,
      hasGameRecap: Boolean(options.hasRecap),
      teamsWithStats: options.teamsWithStats,
      umpire1: game.umpire1 ? { id: game.umpire1.toString() } : undefined,
      umpire2: game.umpire2 ? { id: game.umpire2.toString() } : undefined,
      umpire3: game.umpire3 ? { id: game.umpire3.toString() } : undefined,
      umpire4: game.umpire4 ? { id: game.umpire4.toString() } : undefined,
    };

    return baseGame;
  }

  static formatGameWithRecaps(
    game: dbScheduleGameWithRecaps,
    teamNames: Map<string, string>,
    teamsWithStatsMap?: Map<string, Set<string>>,
  ): ScheduleGameWithRecapsType {
    const homeTeamId = game.hteamid.toString();
    const visitorTeamId = game.vteamid.toString();

    const formattedGame = this.formatGame(game, {
      homeTeamName: teamNames.get(homeTeamId),
      visitorTeamName: teamNames.get(visitorTeamId),
      hasRecap: Boolean(game.gamerecap?.length),
      teamsWithStats: teamsWithStatsForGame(
        homeTeamId,
        visitorTeamId,
        teamsWithStatsMap,
        game.id.toString(),
      ),
    }) as ScheduleGameWithRecapsType;

    if (game.gamerecap?.length) {
      formattedGame.recaps = game.gamerecap.map((recap) => ({
        team: {
          id: recap.teamid.toString(),
        },
        recap: collapseHtmlBlankLines(recap.recap),
      }));
    }

    return formattedGame;
  }

  static formatGamesList(
    games: dbScheduleGameWithDetails[],
    teamNames: Map<string, string>,
    teamsWithStatsMap?: Map<string, Set<string>>,
  ): GameType[] {
    return games.map((game) => {
      const recapCount = Number(
        (game as { _count?: { gamerecap?: number } })._count?.gamerecap ?? 0,
      );
      const homeTeamId = game.hteamid.toString();
      const visitorTeamId = game.vteamid.toString();

      return this.formatGame(game, {
        homeTeamName: teamNames.get(homeTeamId),
        visitorTeamName: teamNames.get(visitorTeamId),
        hasRecap: recapCount > 0,
        teamsWithStats: teamsWithStatsForGame(
          homeTeamId,
          visitorTeamId,
          teamsWithStatsMap,
          game.id.toString(),
        ),
      });
    });
  }
}
