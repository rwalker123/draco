export type GameDateRange = 'today' | 'tonight' | 'tomorrow' | 'this_week' | 'this_weekend';

export interface ResolveGameDateWindowInput {
  range?: GameDateRange;
  from?: string;
  to?: string;
  timezone: string;
  now: Date;
}

export interface GameDateWindow {
  startDate?: string;
  endDate?: string;
  localStart?: string;
  localEnd?: string;
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function localDateInTimeZone(value: Date | string, timezone: string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function localWeekdayInTimeZone(date: Date, timezone: string): number {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  }).format(date);
  return WEEKDAY_INDEX[weekday] ?? 0;
}

function addDays(ymd: string, days: number): string {
  const date = new Date(`${ymd}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function paddedStart(localStart: string): string {
  return `${addDays(localStart, -1)}T00:00:00.000Z`;
}

function paddedEnd(localEnd: string): string {
  return `${addDays(localEnd, 1)}T23:59:59.999Z`;
}

export function localDateBounds(from?: string, to?: string): GameDateWindow {
  return {
    startDate: from ? paddedStart(from) : undefined,
    endDate: to ? paddedEnd(to) : undefined,
    localStart: from,
    localEnd: to,
  };
}

function targetLocalDates(
  range: GameDateRange,
  today: string,
  now: Date,
  timezone: string,
): string[] {
  switch (range) {
    case 'today':
    case 'tonight':
      return [today];
    case 'tomorrow':
      return [addDays(today, 1)];
    case 'this_week':
      return Array.from({ length: 7 }, (_, i) => addDays(today, i));
    case 'this_weekend': {
      const dow = localWeekdayInTimeZone(now, timezone);
      if (dow === 6) {
        return [today, addDays(today, 1)];
      }
      if (dow === 0) {
        return [today];
      }
      const saturdayOffset = 6 - dow;
      return [addDays(today, saturdayOffset), addDays(today, saturdayOffset + 1)];
    }
    default:
      return [today];
  }
}

export function resolveGameDateWindow(input: ResolveGameDateWindowInput): GameDateWindow {
  const { range, from, to, timezone, now } = input;

  if (from || to) {
    return localDateBounds(from, to);
  }

  const today = localDateInTimeZone(now, timezone);
  const localDates = targetLocalDates(range ?? 'today', today, now, timezone).sort();
  const localStart = localDates[0];
  const localEnd = localDates[localDates.length - 1];

  return {
    startDate: paddedStart(localStart),
    endDate: paddedEnd(localEnd),
    localStart,
    localEnd,
  };
}

export function filterGamesByLocalDate<T extends { gameDate: string }>(
  games: T[],
  timezone: string,
  localStart?: string,
  localEnd?: string,
): T[] {
  if (!localStart && !localEnd) {
    return games;
  }
  return games.filter((game) => {
    const localDate = localDateInTimeZone(game.gameDate, timezone);
    if (localStart && localDate < localStart) {
      return false;
    }
    if (localEnd && localDate > localEnd) {
      return false;
    }
    return true;
  });
}
