export function formatGameDate(isoDate: string, timezone: string): string {
  try {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return isoDate;
  }
}
