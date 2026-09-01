import type { Game } from '@/types/schedule';
import { GameStatus } from '@/types/schedule';
import { formatDateInTimezone, formatTimeInTimezone } from '../../../utils/dateUtils';
import { buildCsvContent } from '../../../utils/csvExport';
import type { FieldSummary } from '../hooks/useTeamSeasonSummary';

export interface FieldGameGroup {
  fieldId: string | null;
  fieldName: string;
  games: Game[];
}

export interface FieldGameRow {
  gameId: string;
  fieldName: string;
  date: string;
  time: string;
  league: string;
  matchup: string;
  result: string;
}

export const FIELD_GAME_COLUMN_LABELS = ['Field', 'Date', 'Time', 'League', 'Matchup', 'Result'];

const normalizeFieldId = (value?: string | null): string | null => {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  return null;
};

const sortByGameDate = (a: Game, b: Game): number =>
  new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime();

export const getGameFieldId = (game: Game): string | null =>
  normalizeFieldId(game.field?.id) ?? normalizeFieldId(game.fieldId);

export const selectFieldGames = (games: Game[], fieldId: string | null): Game[] =>
  games.filter((game) => getGameFieldId(game) === fieldId).sort(sortByGameDate);

export const groupGamesByField = (games: Game[], fields: FieldSummary[]): FieldGameGroup[] =>
  fields
    .map((field) => ({
      fieldId: field.fieldId,
      fieldName: field.fieldName,
      games: selectFieldGames(games, field.fieldId),
    }))
    .filter((group) => group.games.length > 0);

export const formatFieldGameDate = (game: Game, timeZone: string): string =>
  formatDateInTimezone(game.gameDate, timeZone, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

export const formatFieldGameTime = (game: Game, timeZone: string): string =>
  formatTimeInTimezone(game.gameDate, timeZone);

export const formatFieldGameMatchup = (game: Game): string => {
  const home = game.homeTeamName || game.homeTeamId;
  const visitor = game.visitorTeamName || game.visitorTeamId;
  return `${home} vs ${visitor}`;
};

export const formatFieldGameResult = (game: Game): string => {
  if (game.gameStatus === GameStatus.Scheduled) {
    return 'Upcoming';
  }
  return game.gameStatusText || '—';
};

export const countFieldGroupGames = (groups: FieldGameGroup[]): number =>
  groups.reduce((total, group) => total + group.games.length, 0);

export const buildFieldGameRows = (groups: FieldGameGroup[], timeZone: string): FieldGameRow[] =>
  groups.flatMap((group) =>
    group.games.map((game) => ({
      gameId: game.id,
      fieldName: group.fieldName,
      date: formatFieldGameDate(game, timeZone),
      time: formatFieldGameTime(game, timeZone),
      league: game.league?.name ?? '',
      matchup: formatFieldGameMatchup(game),
      result: formatFieldGameResult(game),
    })),
  );

export const buildFieldGamesCsv = (groups: FieldGameGroup[], timeZone: string): string =>
  buildCsvContent(
    [
      FIELD_GAME_COLUMN_LABELS,
      ...buildFieldGameRows(groups, timeZone).map((row) => [
        row.fieldName,
        row.date,
        row.time,
        row.league,
        row.matchup,
        row.result,
      ]),
    ],
    { preserveText: true },
  );
