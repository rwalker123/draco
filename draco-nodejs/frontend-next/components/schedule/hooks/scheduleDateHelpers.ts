import type { MutableRefObject } from 'react';
import {
  eachMonthOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';
import { Game, FilterType } from '@/types/schedule';

export const sortGamesAscending = (a: Game, b: Game): number => {
  const diff = new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime();
  if (diff !== 0) {
    return diff;
  }
  return a.id.localeCompare(b.id);
};

export const getMonthKeyFromDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const getMonthRangeForKey = (monthKey: string): { start: Date; end: Date } => {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const start = new Date(year, monthIndex, 1);
  const end = endOfMonth(start);
  return { start, end };
};

export const getMonthKeysForRange = (rangeStart: Date, rangeEnd: Date): string[] => {
  const months = eachMonthOfInterval({
    start: startOfMonth(rangeStart),
    end: startOfMonth(rangeEnd),
  });
  return months.map((monthDate) => getMonthKeyFromDate(monthDate));
};

export const collectGamesForRange = (
  gamesCacheRef: MutableRefObject<Map<string, Game[]>>,
  rangeStart: Date,
  rangeEnd: Date,
): Game[] => {
  const monthKeys = getMonthKeysForRange(rangeStart, rangeEnd);
  const startTime = rangeStart.getTime();
  const endTime = rangeEnd.getTime();

  const aggregated = new Map<string, Game>();
  monthKeys.forEach((monthKey) => {
    const monthGames = gamesCacheRef.current.get(monthKey);
    if (!monthGames) {
      return;
    }

    monthGames.forEach((game) => {
      const gameTime = new Date(game.gameDate).getTime();
      if (gameTime >= startTime && gameTime <= endTime) {
        aggregated.set(game.id, game);
      }
    });
  });

  return Array.from(aggregated.values()).sort(sortGamesAscending);
};

export const computeDateRange = (
  filterType: FilterType,
  filterDate: Date,
): { startDate: Date; endDate: Date } => {
  let start: Date;
  let end: Date;

  switch (filterType) {
    case 'day':
      start = new Date(filterDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(filterDate);
      end.setHours(23, 59, 59, 999);
      break;
    case 'week':
      start = startOfWeek(filterDate);
      end = endOfWeek(filterDate);
      break;
    case 'month':
      start = startOfMonth(filterDate);
      end = endOfMonth(filterDate);
      break;
    case 'year':
      start = startOfYear(filterDate);
      end = endOfYear(filterDate);
      break;
    default:
      start = startOfMonth(filterDate);
      end = endOfMonth(filterDate);
  }

  return { startDate: start, endDate: end };
};
