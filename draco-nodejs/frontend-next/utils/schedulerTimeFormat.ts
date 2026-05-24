export const formatLocalHhmmTo12Hour = (value: string): string => {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return value;
  const hours24 = Number(match[1]);
  if (Number.isNaN(hours24)) return value;
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${match[2] ?? '00'} ${suffix}`;
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
    const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat('en-US', { timeZone, ...opts }).format(d);
    const dateLabel = fmt(start, { weekday: 'short', month: 'short', day: 'numeric' });
    const startTime = fmt(start, { hour: 'numeric', minute: '2-digit', hour12: true });
    const endTime = fmt(end, { hour: 'numeric', minute: '2-digit', hour12: true });
    const tzLabel = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' })
      .formatToParts(start)
      .find((p) => p.type === 'timeZoneName')?.value;
    return `${dateLabel} • ${startTime} – ${endTime}${tzLabel ? ` (${tzLabel})` : ''}`;
  } catch {
    return `${start.toISOString()}–${end.toISOString()}`;
  }
};
