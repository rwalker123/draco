export const formatLocalHhmmTo12Hour = (value: string): string => {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return value;
  const hours24 = Number(match[1]);
  if (Number.isNaN(hours24)) return value;
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${match[2] ?? '00'} ${suffix}`;
};

const pad2 = (value: number): string => String(value).padStart(2, '0');

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const getZonedParts = (date: Date, timeZone: string): ZonedParts => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts: Record<string, number> = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== 'literal') {
      parts[part.type] = Number(part.value);
    }
  }
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour === 24 ? 0 : parts.hour,
    minute: parts.minute,
  };
};

/**
 * UTC ISO instant -> "YYYY-MM-DDTHH:mm" wall-clock value (in timeZone) for a datetime-local input.
 */
export const utcIsoToZonedInputValue = (iso: string, timeZone: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  try {
    const p = getZonedParts(date, timeZone);
    return `${p.year}-${pad2(p.month)}-${pad2(p.day)}T${pad2(p.hour)}:${pad2(p.minute)}`;
  } catch {
    return '';
  }
};

/**
 * "YYYY-MM-DDTHH:mm" wall-clock value (interpreted in timeZone) -> UTC ISO instant.
 * Uses one-step offset inversion; correct except exactly at a DST transition instant.
 */
export const zonedInputValueToUtcIso = (value: string, timeZone: string): string | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  try {
    const guess = Date.UTC(year, month - 1, day, hour, minute);
    const p = getZonedParts(new Date(guess), timeZone);
    const zonedAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    const offset = zonedAsUtc - guess;
    return new Date(guess - offset).toISOString();
  } catch {
    return null;
  }
};

interface ZoneFormatters {
  dateLabel: Intl.DateTimeFormat;
  time: Intl.DateTimeFormat;
  tzName: Intl.DateTimeFormat;
}

const zoneFormattersCache = new Map<string, ZoneFormatters>();

const getZoneFormatters = (timeZone: string): ZoneFormatters => {
  const cached = zoneFormattersCache.get(timeZone);
  if (cached) return cached;
  const formatters: ZoneFormatters = {
    dateLabel: new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }),
    time: new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
    tzName: new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' }),
  };
  zoneFormattersCache.set(timeZone, formatters);
  return formatters;
};

export const formatLocalTimeRange = (
  startIso: string,
  endIso: string,
  timeZone: string,
): string => {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startIso}–${endIso}`;
  }
  try {
    const { dateLabel, time, tzName } = getZoneFormatters(timeZone);
    const startDateLabel = dateLabel.format(start);
    const endDateLabel = dateLabel.format(end);
    const startTime = time.format(start);
    const endTime = time.format(end);
    const tzLabel = tzName.formatToParts(start).find((p) => p.type === 'timeZoneName')?.value;
    const tzSuffix = tzLabel ? ` (${tzLabel})` : '';
    const range =
      startDateLabel === endDateLabel
        ? `${startDateLabel} • ${startTime} – ${endTime}`
        : `${startDateLabel} ${startTime} – ${endDateLabel} ${endTime}`;
    return `${range}${tzSuffix}`;
  } catch {
    return `${start.toISOString()}–${end.toISOString()}`;
  }
};
