import { Game } from '../components/GameListDisplay';
import { getGameStatusText } from './gameUtils';
import { GameStatus, GameType } from '../types/schedule';

export const transformGamesFromAPI = (games: unknown[]): Game[] =>
  games
    .filter((game): game is Record<string, unknown> => typeof game === 'object' && game !== null)
    .map((game) => {
      let leagueName = 'Unknown';
      if (
        typeof game.league === 'object' &&
        game.league &&
        'name' in game.league &&
        typeof (game.league as { name?: unknown }).name === 'string'
      ) {
        leagueName = (game.league as { name: string }).name;
      }

      let fieldName: string | null = null;
      let fieldShortName: string | null = null;
      if (typeof game.field === 'object' && game.field) {
        if ('name' in game.field && typeof (game.field as { name?: unknown }).name === 'string') {
          fieldName = (game.field as { name: string }).name;
        }
        if (
          'shortName' in game.field &&
          typeof (game.field as { shortName?: unknown }).shortName === 'string'
        ) {
          fieldShortName = (game.field as { shortName: string }).shortName;
        }
      }

      const gameStatus =
        typeof game.gameStatus === 'number' ? game.gameStatus : GameStatus.Scheduled;

      return {
        id: String(game.id ?? ''),
        date: String(game.gameDate ?? ''),
        homeTeamId: String(game.homeTeamId ?? ''),
        awayTeamId: String(game.visitorTeamId ?? ''),
        homeTeamName: typeof game.homeTeamName === 'string' ? game.homeTeamName : 'Unknown',
        awayTeamName: typeof game.visitorTeamName === 'string' ? game.visitorTeamName : 'Unknown',
        homeScore: typeof game.homeScore === 'number' ? game.homeScore : 0,
        awayScore: typeof game.visitorScore === 'number' ? game.visitorScore : 0,
        gameStatus,
        gameStatusText: getGameStatusText(gameStatus),
        leagueName,
        fieldId: 'fieldId' in game ? (game.fieldId === null ? null : String(game.fieldId)) : null,
        fieldName,
        fieldShortName,
        hasGameRecap: false, // No recaps in scoreboard
        gameRecaps: [], // No recaps in scoreboard
        gameType: typeof game.gameType === 'number' ? game.gameType : GameType.RegularSeason,
      };
    });

export const createGamesLoader = (accountId: string, currentSeasonId: string, teamId?: string) => {
  return async (startDate: Date, endDate: Date): Promise<Game[]> => {
    const response = await fetch(
      `/api/accounts/${accountId}/seasons/${currentSeasonId}/games?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}${teamId ? `&teamId=${teamId}` : ''}`,
    );
    const data = await response.json();

    if (!data.success) {
      throw new Error('Failed to load games data');
    }

    return transformGamesFromAPI(data.data.games);
  };
};
