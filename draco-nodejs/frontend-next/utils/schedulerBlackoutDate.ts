import { endOfDayInTimezone, getDateKeyInTimezone, startOfDayInTimezone } from './dateUtils';

export const isoToDateInput = (iso: string | undefined, timeZone: string): string =>
  iso ? (getDateKeyInTimezone(iso, timeZone) ?? '') : '';

export const dateInputToIso = (
  dateStr: string,
  timeZone: string,
  boundary: 'start' | 'end',
): string => {
  const anchor = new Date(`${dateStr}T12:00:00Z`);
  const instant =
    boundary === 'start'
      ? startOfDayInTimezone(anchor, timeZone)
      : endOfDayInTimezone(anchor, timeZone);
  return instant.toISOString();
};
