import {
  listSeasonGames,
  type Game as ApiClientGame,
  type GamesWithRecaps as ApiClientGamesWithRecaps,
} from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import type {
  GameRecapsType,
  GameType as ApiGameType,
  TeamSeasonNameType,
} from '@draco/shared-schemas';
import { Game as ScheduleGame, GameStatus } from '../types/schedule';
import { Game } from '../components/GameListDisplay';
import { GameCardData } from '../components/GameCard';
import { getGameStatusText, getGameStatusShortText } from './gameUtils';
import { unwrapApiResult } from './apiResult';

type ApiGame =
  | GameRecapsType
  | ApiGameType
  | ApiClientGame
  | ApiClientGamesWithRecaps['games'][number];

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
  if (!('recaps' in game) || !Array.isArray(game.recaps)) {
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
      address: null,
      city: null,
      state: null,
      zip: null,
      zipCode: null,
      rainoutNumber: null,
      comment: null,
      directions: null,
      latitude: null,
      longitude: null,
    };
  }

  return {
    id: game.field.id ?? null,
    name: game.field.name ?? null,
    shortName: game.field.shortName ?? null,
    address:
      'address' in game.field
        ? ((game.field as { address?: string | null }).address ?? null)
        : null,
    city: 'city' in game.field ? ((game.field as { city?: string | null }).city ?? null) : null,
    state: 'state' in game.field ? ((game.field as { state?: string | null }).state ?? null) : null,
    zip: 'zip' in game.field ? ((game.field as { zip?: string | null }).zip ?? null) : null,
    zipCode:
      'zipCode' in game.field
        ? ((game.field as { zipCode?: string | null }).zipCode ?? null)
        : null,
    rainoutNumber:
      'rainoutNumber' in game.field
        ? ((game.field as { rainoutNumber?: string | null }).rainoutNumber ?? null)
        : null,
    comment:
      'comment' in game.field
        ? ((game.field as { comment?: string | null }).comment ?? null)
        : null,
    directions:
      'directions' in game.field
        ? ((game.field as { directions?: string | null }).directions ?? null)
        : null,
    latitude:
      'latitude' in game.field
        ? ((game.field as { latitude?: string | null }).latitude ?? null)
        : null,
    longitude:
      'longitude' in game.field
        ? ((game.field as { longitude?: string | null }).longitude ?? null)
        : null,
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
  const fieldDetails = field.id || field.name || field.shortName ? field : null;

  return {
    id: String(game.id),
    date: game.gameDate,
    homeTeamId: String(game.homeTeam?.id ?? ''),
    visitorTeamId: String(game.visitorTeam?.id ?? ''),
    homeTeamName: game.homeTeam?.name ?? 'Unknown Team',
    visitorTeamName: game.visitorTeam?.name ?? 'Unknown Team',
    homeScore: Number(game.homeScore ?? 0),
    visitorScore: Number(game.visitorScore ?? 0),
    gameStatus,
    gameStatusText: parseGameStatusText(gameStatus, game.gameStatusText),
    gameStatusShortText: parseGameStatusShortText(gameStatus, game.gameStatusShortText),
    leagueName: game.league?.name ?? 'Unknown League',
    fieldId: field.id,
    fieldName: field.name,
    fieldShortName: field.shortName,
    fieldDetails,
    hasGameRecap: recaps.length > 0 || Boolean((game as { hasGameRecap?: boolean }).hasGameRecap),
    gameRecaps: recaps,
    comment: game.comment ?? '',
    gameType: parsedGameType ?? undefined,
    baseballExtras: {
      umpire1: mapUmpireId(game.umpire1 as { id: string } | undefined),
      umpire2: mapUmpireId(game.umpire2 as { id: string } | undefined),
      umpire3: mapUmpireId(game.umpire3 as { id: string } | undefined),
      umpire4: mapUmpireId(game.umpire4 as { id: string } | undefined),
    },
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
    hasGameRecap: game.hasGameRecap,
    fieldId: toOptionalString(game.field?.id),
    field: mapScheduleFieldDetails(game),
    gameStatus,
    gameStatusText: parseGameStatusText(gameStatus, game.gameStatusText),
    gameStatusShortText: parseGameStatusShortText(gameStatus, game.gameStatusShortText),
    gameType: parsedGameType,
    league: {
      id: String(game.league?.id ?? ''),
      name: game.league?.name ?? '',
    },
    season: {
      id: String(game.season?.id ?? ''),
      name: game.season?.name ?? '',
    },
    baseballExtras: {
      umpire1: mapUmpireId(game.umpire1 as { id: string } | undefined),
      umpire2: mapUmpireId(game.umpire2 as { id: string } | undefined),
      umpire3: mapUmpireId(game.umpire3 as { id: string } | undefined),
      umpire4: mapUmpireId(game.umpire4 as { id: string } | undefined),
    },
  };
};

type FieldLike = {
  id?: string | null;
  name?: string | null;
  shortName?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  zipCode?: string | null;
  rainoutNumber?: string | null;
  comment?: string | null;
  directions?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
};

/**
 * Converts Game objects to GameCardData for display components
 * Handles both Game types (from GameListDisplay and from types/schedule)
 */
const isDisplayGame = (game: Game | ScheduleGame): game is Game => 'gameRecaps' in game;

const mergeFieldDetails = (
  primary: FieldLike | null | undefined,
  secondary: FieldLike | null | undefined,
  fallback: FieldLike | null | undefined,
  fieldId: string | null,
): GameCardData['fieldDetails'] => {
  const merged: FieldLike = {
    id: primary?.id ?? secondary?.id ?? fallback?.id ?? fieldId ?? null,
    name: primary?.name ?? secondary?.name ?? fallback?.name ?? null,
    shortName: primary?.shortName ?? secondary?.shortName ?? fallback?.shortName ?? null,
    address: primary?.address ?? secondary?.address ?? fallback?.address ?? null,
    city: primary?.city ?? secondary?.city ?? fallback?.city ?? null,
    state: primary?.state ?? secondary?.state ?? fallback?.state ?? null,
    zip: primary?.zip ?? secondary?.zip ?? fallback?.zip ?? null,
    zipCode: primary?.zipCode ?? secondary?.zipCode ?? fallback?.zipCode ?? null,
    rainoutNumber:
      primary?.rainoutNumber ?? secondary?.rainoutNumber ?? fallback?.rainoutNumber ?? null,
    comment: primary?.comment ?? secondary?.comment ?? fallback?.comment ?? null,
    directions: primary?.directions ?? secondary?.directions ?? fallback?.directions ?? null,
    latitude: primary?.latitude ?? secondary?.latitude ?? fallback?.latitude ?? null,
    longitude: primary?.longitude ?? secondary?.longitude ?? fallback?.longitude ?? null,
  };

  const hasValue = Object.values(merged).some((value) => {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value);
    }

    return true;
  });

  return hasValue ? (merged as GameCardData['fieldDetails']) : null;
};

export function convertGameToGameCardData(
  game: Game | ScheduleGame,
  teams: Array<TeamSeasonNameType> = [],
  fields: FieldLike[] = [],
): GameCardData {
  const targetFieldId = game.fieldId ?? null;
  const fieldFromCollection =
    targetFieldId !== null
      ? fields.find((field) => (field.id ?? null) === targetFieldId)
      : undefined;

  if (isDisplayGame(game)) {
    const homeTeam = teams.find((team) => team.id === game.homeTeamId);
    const visitorTeam = teams.find((team) => team.id === game.visitorTeamId);
    const fallbackField: FieldLike | null =
      game.fieldName || game.fieldShortName
        ? {
            id: game.fieldId ?? null,
            name: game.fieldName ?? null,
            shortName: game.fieldShortName ?? null,
          }
        : null;

    return {
      ...game,
      homeTeamName: homeTeam?.name || game.homeTeamName,
      visitorTeamName: visitorTeam?.name || game.visitorTeamName,
      fieldDetails: mergeFieldDetails(
        game.fieldDetails,
        fieldFromCollection,
        fallbackField,
        targetFieldId,
      ),
    };
  }

  const homeTeam = teams.find((team) => team.id === game.homeTeamId);
  const visitorTeam = teams.find((team) => team.id === game.visitorTeamId);
  const fallbackField: FieldLike | null =
    game.field || targetFieldId
      ? {
          id: game.field?.id ?? targetFieldId ?? null,
          name: game.field?.name ?? null,
          shortName: game.field?.shortName ?? null,
          address: game.field?.address ?? null,
          city: game.field?.city ?? null,
          state: game.field?.state ?? null,
          zip:
            (game.field as { zip?: string | null })?.zip ??
            (game.field as { zipCode?: string | null })?.zipCode ??
            null,
          zipCode: (game.field as { zipCode?: string | null })?.zipCode ?? null,
          rainoutNumber: (game.field as { rainoutNumber?: string | null })?.rainoutNumber ?? null,
          comment: (game.field as { comment?: string | null })?.comment ?? null,
          directions: (game.field as { directions?: string | null })?.directions ?? null,
          latitude: (game.field as { latitude?: string | null })?.latitude ?? null,
          longitude: (game.field as { longitude?: string | null })?.longitude ?? null,
        }
      : null;

  const hasGolfData = game.golfExtras !== undefined;
  const hasBaseballData = game.baseballExtras !== undefined;

  return {
    id: game.id,
    date: game.gameDate,
    homeTeamId: game.homeTeamId,
    visitorTeamId: game.visitorTeamId,
    homeTeamName: homeTeam?.name || 'Unknown Team',
    visitorTeamName: visitorTeam?.name || 'Unknown Team',
    homeScore: game.homeScore,
    visitorScore: game.visitorScore,
    gameStatus: game.gameStatus,
    gameStatusText: game.gameStatusText,
    gameStatusShortText: game.gameStatusShortText,
    leagueName: game.league.name,
    fieldId: game.fieldId || null,
    fieldName: game.field?.name || null,
    fieldShortName: game.field?.shortName || null,
    fieldDetails: mergeFieldDetails(null, fieldFromCollection, fallbackField, targetFieldId),
    hasGameRecap: Boolean(game.hasGameRecap),
    gameRecaps: [],
    comment: game.comment,
    gameType: game.gameType,
    ...(hasGolfData && { golfExtras: game.golfExtras }),
    ...(hasBaseballData && { baseballExtras: game.baseballExtras }),
  };
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
