import { GameStatus } from '../types/gameEnums.js';
import type { dbGameInfo } from '../repositories/index.js';

const ICS_LINE_OCTET_LIMIT = 75;
const PROD_ID = '-//Draco Sports Manager//Team Calendar Feed//EN';

export const escapeIcsText = (s: string): string =>
  s
    .replace(/\\/g, '\\\\')
    .replace(/\r/g, '')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');

export const formatIcsDateTime = (d: Date): string => {
  const pad = (n: number, len = 2) => n.toString().padStart(len, '0');
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
};

export const foldIcsLine = (line: string): string => {
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

const mapGameStatusToIcsStatus = (gamestatus: number): string => {
  switch (gamestatus) {
    case GameStatus.Rainout:
    case GameStatus.Postponed:
      return 'CANCELLED';
    default:
      return 'CONFIRMED';
  }
};

const buildFieldLocation = (field: dbGameInfo['availablefields']): string | null => {
  if (!field) return null;
  const parts = [
    field.name,
    field.address,
    [field.city, field.state].filter(Boolean).join(', '),
    field.zipcode,
  ].filter((p) => p && p.trim().length > 0);
  return parts.length > 0 ? parts.join(', ') : null;
};

export interface IcsVEventInput {
  game: dbGameInfo;
  dtstamp: string;
  gameDurationMinutes: number;
  uidDomain: string;
  leagueName: string | null;
}

export const buildVEvent = ({
  game,
  dtstamp,
  gameDurationMinutes,
  uidDomain,
  leagueName,
}: IcsVEventInput): string => {
  const dtstart = formatIcsDateTime(game.gamedate);
  const dtend = formatIcsDateTime(new Date(game.gamedate.getTime() + gameDurationMinutes * 60000));
  const homeName = game.hometeam?.name ?? 'Home';
  const visitorName = game.visitingteam?.name ?? 'Visitor';
  const baseTitle = `${visitorName} @ ${homeName}`;
  const summary = leagueName ? `${leagueName}: ${baseTitle}` : baseTitle;
  const location = buildFieldLocation(game.availablefields);

  const lines: string[] = [
    'BEGIN:VEVENT',
    `UID:game-${game.id}@${uidDomain}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeIcsText(summary)}`,
  ];

  if (location) {
    lines.push(`LOCATION:${escapeIcsText(location)}`);
  }

  lines.push(`STATUS:${mapGameStatusToIcsStatus(game.gamestatus)}`);
  lines.push('SEQUENCE:0');
  lines.push('END:VEVENT');

  return lines.join('\r\n');
};

export interface IcsCalendarInput {
  prodId?: string;
  calendarName: string;
  events: string[];
}

export const buildIcsCalendar = ({ prodId, calendarName, events }: IcsCalendarInput): string => {
  const escapedName = escapeIcsText(calendarName);
  const headerLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${prodId ?? PROD_ID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapedName}`,
    `NAME:${escapedName}`,
    'X-PUBLISHED-TTL:PT1H',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
  ];

  const eventLines = events.flatMap((block) => block.split('\r\n'));
  const allLines = [...headerLines, ...eventLines, 'END:VCALENDAR'];
  return `${allLines.map(foldIcsLine).join('\r\n')}\r\n`;
};
