import { listSeasonGames } from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import type { GamesWithRecapsType, TeamSeasonNameType } from '@draco/shared-schemas';
import { Game as ScheduleGame, GameStatus } from '../types/schedule';
import { Game } from '../components/GameListDisplay';
import { GameCardData } from '../components/GameCard';
import { getGameStatusText, getGameStatusShortText } from './gameUtils';
import { unwrapApiResult } from './apiResult';

type ApiGame = GamesWithRecapsType['games'][number];

const toOptionalString = (value?: string | null): string | undefined => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  return undefined;
};

const parseGameStatusText = (statusValue: number, statusText?: string | null): string => {
  if (typeof statusText === 'string' && statusText.trim().length > 0) {
    return statusText;
  }
  return getGameStatusText(statusValue);
};

const parseGameStatusShortText = (statusValue: number, statusShortText?: string | null): string => {
  if (typeof statusShortText === 'string' && statusShortText.trim().length > 0) {
    return statusShortText;
  }
  return getGameStatusShortText(statusValue);
};

const normalizeGameType = (value: string | number | undefined): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const parsedValue = typeof value === 'number' ? value : Number(value);
  return Number.isNaN(parsedValue) ? undefined : parsedValue;
};

const mapRecaps = (game: ApiGame) => {
  if (!Array.isArray(game.recaps)) {
    return [] as Game['gameRecaps'];
  }

  return game.recaps.map((recap) => ({
    teamId: String(recap.team?.id ?? ''),
    recap: recap.recap,
  }));
};

const mapField = (game: ApiGame) => {
  if (!game.field) {
    return {
      id: null,
      name: null,
      shortName: null,
    };
  }

  return {
    id: game.field.id ?? null,
    name: game.field.name ?? null,
    shortName: game.field.shortName ?? null,
  };
};

const mapUmpireId = (umpire?: { id: string } | null): string | undefined => {
  if (!umpire?.id) {
    return undefined;
  }

  return umpire.id;
};

const mapScheduleFieldDetails = (game: ApiGame): ScheduleGame['field'] | undefined => {
  if (!game.field) {
    return undefined;
  }

  return {
    id: game.field.id ?? '',
    name: game.field.name ?? '',
    shortName: game.field.shortName ?? '',
    address: game.field.address ?? '',
    city: game.field.city ?? '',
    state: game.field.state ?? '',
  };
};

const mapApiGameToGameCard = (game: ApiGame): Game => {
  const gameStatus = game.gameStatus ?? GameStatus.Scheduled;
  const recaps = mapRecaps(game);
  const field = mapField(game);
  const parsedGameType = normalizeGameType(game.gameType);

  return {
    id: String(game.id),
    date: game.gameDate,
    homeTeamId: String(game.homeTeam?.id ?? ''),
    awayTeamId: String(game.visitorTeam?.id ?? ''),
    homeTeamName: game.homeTeam?.name ?? 'Unknown Team',
    awayTeamName: game.visitorTeam?.name ?? 'Unknown Team',
    homeScore: Number(game.homeScore ?? 0),
    awayScore: Number(game.visitorScore ?? 0),
    gameStatus,
    gameStatusText: parseGameStatusText(gameStatus, game.gameStatusText),
    gameStatusShortText: parseGameStatusShortText(gameStatus, game.gameStatusShortText),
    leagueName: game.league?.name ?? 'Unknown League',
    fieldId: field.id,
    fieldName: field.name,
    fieldShortName: field.shortName,
    hasGameRecap: recaps.length > 0,
    gameRecaps: recaps,
    comment: game.comment ?? '',
    gameType: parsedGameType ?? undefined,
    umpire1: mapUmpireId(game.umpire1 as { id: string } | undefined),
    umpire2: mapUmpireId(game.umpire2 as { id: string } | undefined),
    umpire3: mapUmpireId(game.umpire3 as { id: string } | undefined),
    umpire4: mapUmpireId(game.umpire4 as { id: string } | undefined),
  };
};

export const transformGamesFromAPI = (games: ApiGame[]): Game[] => {
  return games.map(mapApiGameToGameCard);
};

export const mapGameResponseToScheduleGame = (game: ApiGame): ScheduleGame => {
  const gameStatus = game.gameStatus ?? GameStatus.Scheduled;
  const parsedGameType = normalizeGameType(game.gameType) ?? 0;

  return {
    id: String(game.id),
    gameDate: game.gameDate,
    homeTeamId: String(game.homeTeam?.id ?? ''),
    visitorTeamId: String(game.visitorTeam?.id ?? ''),
    homeScore: Number(game.homeScore ?? 0),
    visitorScore: Number(game.visitorScore ?? 0),
    comment: game.comment ?? '',
    fieldId: toOptionalString(game.field?.id),
    field: mapScheduleFieldDetails(game),
    gameStatus,
    gameStatusText: parseGameStatusText(gameStatus, game.gameStatusText),
    gameStatusShortText: parseGameStatusShortText(gameStatus, game.gameStatusShortText),
    gameType: parsedGameType,
    umpire1: mapUmpireId(game.umpire1 as { id: string } | undefined),
    umpire2: mapUmpireId(game.umpire2 as { id: string } | undefined),
    umpire3: mapUmpireId(game.umpire3 as { id: string } | undefined),
    umpire4: mapUmpireId(game.umpire4 as { id: string } | undefined),
    league: {
      id: String(game.league?.id ?? ''),
      name: game.league?.name ?? '',
    },
    season: {
      id: String(game.season?.id ?? ''),
      name: game.season?.name ?? '',
    },
  };
};

/**
 * Converts Game objects to GameCardData for display components
 * Handles both Game types (from GameListDisplay and from types/schedule)
 */
export function convertGameToGameCardData(
  game: Game,
  teams?: Array<TeamSeasonNameType>,
): GameCardData;
export function convertGameToGameCardData(
  game: ScheduleGame,
  teams: Array<TeamSeasonNameType>,
): GameCardData;
export function convertGameToGameCardData(
  game: Game | ScheduleGame,
  teams: Array<TeamSeasonNameType> = [],
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

export const createGamesLoader = (
  client: Client,
  accountId: string,
  currentSeasonId: string,
  teamId?: string,
) => {
  return async (startDate: Date, endDate: Date): Promise<Game[]> => {
    const result = await listSeasonGames({
      client,
      path: { accountId, seasonId: currentSeasonId },
      query: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        teamId,
        sortOrder: 'asc',
      },
      throwOnError: false,
    });

    const data = unwrapApiResult(result, 'Failed to load games data');
    return transformGamesFromAPI(data.games);
  };
};
