import { Game as ScheduleGame } from '../types/schedule';
import { Game } from '../components/GameListDisplay';
import { GameCardData } from '../components/GameCard';
import { getGameStatusText, getGameStatusShortText } from './gameUtils';
import { GameStatus, GameType } from '../types/schedule';

// Type for raw API game data
interface APIGameData {
  id: unknown;
  gameDate: unknown;
  homeTeamId: unknown;
  visitorTeamId: unknown;
  homeTeamName?: unknown;
  visitorTeamName?: unknown;
  homeScore: unknown;
  visitorScore: unknown;
  gameStatus: unknown;
  gameType: unknown;
  fieldId?: unknown;
  comment?: unknown;
  league?: {
    id?: unknown;
    name?: unknown;
  };
  field?: {
    id?: unknown;
    name?: unknown;
    shortName?: unknown;
    address?: unknown;
    city?: unknown;
    state?: unknown;
  };
  umpire1?: unknown;
  umpire2?: unknown;
  umpire3?: unknown;
  umpire4?: unknown;
  season?: {
    id?: unknown;
    name?: unknown;
  };
}

// Helper to safely extract string values
const safeString = (value: unknown, fallback = ''): string => {
  return typeof value === 'string' ? value : fallback;
};

// Helper to safely extract number values
const safeNumber = (value: unknown, fallback = 0): number => {
  return typeof value === 'number' ? value : fallback;
};

// Helper to safely extract optional string values
const safeOptionalString = (value: unknown): string | undefined => {
  return typeof value === 'string' ? value : undefined;
};

/**
 * Transforms raw API game data to typed Game objects (from GameListDisplay)
 */
export const transformGamesFromAPI = (games: unknown[]): Game[] => {
  return games
    .filter((game): game is Record<string, unknown> => typeof game === 'object' && game !== null)
    .map((rawGame): Game => {
      const game = rawGame as unknown as APIGameData;
      const gameStatus = safeNumber(game.gameStatus, GameStatus.Scheduled);

      return {
        id: safeString(game.id),
        date: safeString(game.gameDate), // Note: Game interface uses 'date' while ScheduleGame uses 'gameDate'
        homeTeamId: safeString(game.homeTeamId),
        awayTeamId: safeString(game.visitorTeamId), // Note: Game interface uses 'awayTeamId' while ScheduleGame uses 'visitorTeamId'
        homeTeamName: 'Unknown Team', // TODO: Need to fetch team names or pass them in
        awayTeamName: 'Unknown Team', // TODO: Need to fetch team names or pass them in
        homeScore: safeNumber(game.homeScore),
        awayScore: safeNumber(game.visitorScore), // Note: Game interface uses 'awayScore' while ScheduleGame uses 'visitorScore'
        gameStatus,
        gameStatusText: getGameStatusText(gameStatus),
        gameStatusShortText: getGameStatusShortText(gameStatus),
        leagueName: safeString(game.league?.name, 'Unknown League'),
        fieldId: safeOptionalString(game.fieldId) || null,
        fieldName: game.field?.name ? safeString(game.field.name) : null,
        fieldShortName: game.field?.shortName ? safeString(game.field.shortName) : null,
        hasGameRecap: false, // TODO: Implement game recaps from API
        gameRecaps: [],
        comment: safeString(game.comment),
        gameType: safeNumber(game.gameType, GameType.RegularSeason),
        umpire1: safeOptionalString(game.umpire1),
        umpire2: safeOptionalString(game.umpire2),
        umpire3: safeOptionalString(game.umpire3),
        umpire4: safeOptionalString(game.umpire4),
      };
    });
};

/**
 * Converts Game objects to GameCardData for display components
 * Handles both Game types (from GameListDisplay and from types/schedule)
 */
export function convertGameToGameCardData(
  game: Game,
  teams?: Array<{ id: string; name: string }>,
): GameCardData;
export function convertGameToGameCardData(
  game: ScheduleGame,
  teams: Array<{ id: string; name: string }>,
): GameCardData;
export function convertGameToGameCardData(
  game: Game | ScheduleGame,
  teams: Array<{ id: string; name: string }> = [],
): GameCardData {
  // Check if this is a Game from GameListDisplay (has hasGameRecap property)
  if ('hasGameRecap' in game) {
    // Update team names if provided
    const homeTeam = teams.find((team) => team.id === game.homeTeamId);
    const awayTeam = teams.find((team) => team.id === game.awayTeamId);

    return {
      ...game,
      homeTeamName: homeTeam?.name || game.homeTeamName,
      awayTeamName: awayTeam?.name || game.awayTeamName,
    };
  } else {
    // This is a ScheduleGame, convert to GameCardData
    const homeTeam = teams.find((team) => team.id === game.homeTeamId);
    const awayTeam = teams.find((team) => team.id === game.visitorTeamId);

    return {
      id: game.id,
      date: game.gameDate,
      homeTeamId: game.homeTeamId,
      awayTeamId: game.visitorTeamId,
      homeTeamName: homeTeam?.name || 'Unknown Team',
      awayTeamName: awayTeam?.name || 'Unknown Team',
      homeScore: game.homeScore,
      awayScore: game.visitorScore,
      gameStatus: game.gameStatus,
      gameStatusText: game.gameStatusText,
      gameStatusShortText: game.gameStatusShortText,
      leagueName: game.league.name,
      fieldId: game.fieldId || null,
      fieldName: game.field?.name || null,
      fieldShortName: game.field?.shortName || null,
      hasGameRecap: false, // TODO: Implement game recaps
      gameRecaps: [],
      comment: game.comment,
      gameType: game.gameType,
      umpire1: game.umpire1,
      umpire2: game.umpire2,
      umpire3: game.umpire3,
      umpire4: game.umpire4,
    };
  }
}

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
