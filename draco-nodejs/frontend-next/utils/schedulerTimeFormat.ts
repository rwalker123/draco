export const formatLocalHhmmTo12Hour = (value: string): string => {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return value;
  const hours24 = Number(match[1]);
  if (Number.isNaN(hours24)) return value;
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${match[2] ?? '00'} ${suffix}`;
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
    const dateLabelText = dateLabel.format(start);
    const startTime = time.format(start);
    const endTime = time.format(end);
    const tzLabel = tzName.formatToParts(start).find((p) => p.type === 'timeZoneName')?.value;
    return `${dateLabelText} • ${startTime} – ${endTime}${tzLabel ? ` (${tzLabel})` : ''}`;
  } catch {
    return `${start.toISOString()}–${end.toISOString()}`;
  }
};
