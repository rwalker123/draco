import type { GameCardData } from '../components/GameCard';
import { downloadBlob } from './downloadUtils';

export interface CalendarEvent {
  uid: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
  url?: string;
}

const DEFAULT_PROD_ID = '-//Draco//Calendar//EN';
const ICS_LINE_OCTET_LIMIT = 75;

const escapeIcsText = (value: string): string =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\r/g, '')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');

const formatIcsDateTime = (date: Date): string => {
  const pad = (value: number, length = 2) => value.toString().padStart(length, '0');
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
};

const foldIcsLine = (line: string): string => {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= ICS_LINE_OCTET_LIMIT) {
    return line;
  }
  const segments: string[] = [];
  let current = '';
  let currentBytes = 0;
  for (const char of line) {
    const charBytes = encoder.encode(char).length;
    const limit = segments.length === 0 ? ICS_LINE_OCTET_LIMIT : ICS_LINE_OCTET_LIMIT - 1;
    if (currentBytes + charBytes > limit) {
      segments.push(current);
      current = char;
      currentBytes = charBytes;
    } else {
      current += char;
      currentBytes += charBytes;
    }
  }
  if (current.length > 0) {
    segments.push(current);
  }
  return segments.join('\r\n ');
};

const buildEventLines = (event: CalendarEvent, dtStamp: string): string[] => {
  const lines: string[] = ['BEGIN:VEVENT'];
  lines.push(`UID:${escapeIcsText(event.uid)}`);
  lines.push(`DTSTAMP:${dtStamp}`);
  lines.push(`DTSTART:${formatIcsDateTime(event.start)}`);
  lines.push(`DTEND:${formatIcsDateTime(event.end)}`);
  lines.push(`SUMMARY:${escapeIcsText(event.title)}`);
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeIcsText(event.location)}`);
  }
  if (event.url) {
    lines.push(`URL:${event.url}`);
  }
  lines.push('END:VEVENT');
  return lines;
};

export const buildIcsContent = (
  events: CalendarEvent[],
  prodId: string = DEFAULT_PROD_ID,
): string => {
  const dtStamp = formatIcsDateTime(new Date());
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${prodId}`,
    'CALSCALE:GREGORIAN',
  ];
  for (const event of events) {
    lines.push(...buildEventLines(event, dtStamp));
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldIcsLine).join('\r\n');
};

export const formatLocalDateStamp = (date: Date): string => {
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
};

export const sanitizeIcsFilename = (input: string): string => {
  const trimmed = input.trim().toLowerCase();
  const collapsed = trimmed.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return collapsed.length > 0 ? collapsed : 'calendar';
};

export const downloadIcsFile = (filename: string, content: string): void => {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  downloadBlob(blob, filename);
};

const formatFieldAddress = (game: GameCardData): string => {
  const details = game.fieldDetails;
  if (!details) {
    return game.fieldName ?? '';
  }
  const namePart = details.name ?? game.fieldName ?? '';
  const cityState = [details.city, details.state]
    .filter((part) => part && part.length > 0)
    .join(', ');
  const zip = details.zip ?? details.zipCode ?? '';
  const cityStateZip = [cityState, zip].filter((part) => part && part.length > 0).join(' ');
  const lineParts = [namePart, details.address ?? '', cityStateZip].filter(
    (part) => part && part.length > 0,
  );
  return lineParts.join(', ');
};

export interface GameToCalendarEventOptions {
  origin: string;
  pageHref: string;
}

export const gameToCalendarEvent = (
  game: GameCardData,
  options: GameToCalendarEventOptions,
): CalendarEvent => {
  const start = new Date(game.date);
  const end = new Date(game.date);
  const baseTitle = `${game.visitorTeamName} @ ${game.homeTeamName}`;
  const title = game.leagueName ? `${game.leagueName}: ${baseTitle}` : baseTitle;
  const url = `${options.origin}${options.pageHref}`;
  const descriptionParts = [
    game.leagueName ? `League: ${game.leagueName}` : '',
    game.comment ?? '',
    url,
  ].filter((part) => part.length > 0);
  return {
    uid: `game-${game.id}@draco`,
    title,
    start,
    end,
    location: formatFieldAddress(game),
    description: descriptionParts.join('\n'),
    url,
  };
};
