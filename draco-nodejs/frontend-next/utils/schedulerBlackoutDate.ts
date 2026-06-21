import { dateKeyToInstantInTimezone, getDateKeyInTimezone } from './dateUtils';

export const isoToDateInput = (iso: string | undefined, timeZone: string): string =>
  iso ? (getDateKeyInTimezone(iso, timeZone) ?? '') : '';

export const dateInputToIso = (
  dateStr: string,
  timeZone: string,
  boundary: 'start' | 'end',
): string => dateKeyToInstantInTimezone(dateStr, timeZone, boundary).toISOString();
