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

export type ScheduleGameWithRecapsType = GamesWithRecapsType['games'][number];

interface FormatGameOptions {
  homeTeamName?: string;
  visitorTeamName?: string;
  hasRecap?: boolean;
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
        id: game.leagueseason.league.id.toString(),
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
      field: game.availablefields
        ? {
            id: game.availablefields.id.toString(),
            name: game.availablefields.name,
            shortName: game.availablefields.shortname,
            address: game.availablefields.address,
            city: game.availablefields.city,
            state: game.availablefields.state,
            zip: game.availablefields.zipcode,
          }
        : undefined,
      gameStatus: game.gamestatus,
      gameStatusText: getGameStatusText(game.gamestatus) as GameStatusEnumType,
      gameStatusShortText: getGameStatusShortText(game.gamestatus) as GameStatusShortEnumType,
      gameType: game.gametype.toString(),
      hasGameRecap: options.hasRecap,
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
  ): ScheduleGameWithRecapsType {
    const homeTeamId = game.hteamid.toString();
    const visitorTeamId = game.vteamid.toString();

    const formattedGame = this.formatGame(game, {
      homeTeamName: teamNames.get(homeTeamId),
      visitorTeamName: teamNames.get(visitorTeamId),
      hasRecap: Boolean(game.gamerecap?.length),
    }) as ScheduleGameWithRecapsType;

    if (game.gamerecap?.length) {
      formattedGame.recaps = game.gamerecap.map((recap) => ({
        team: {
          id: recap.teamid.toString(),
        },
        recap: recap.recap,
      }));
    }

    return formattedGame;
  }

  static formatGamesList(
    games: dbScheduleGameWithDetails[],
    teamNames: Map<string, string>,
  ): GameType[] {
    return games.map((game) =>
      this.formatGame(game, {
        homeTeamName: teamNames.get(game.hteamid.toString()),
        visitorTeamName: teamNames.get(game.vteamid.toString()),
      }),
    );
  }
}
