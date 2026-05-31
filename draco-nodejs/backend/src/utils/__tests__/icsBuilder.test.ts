import { describe, it, expect } from 'vitest';
import {
  escapeIcsText,
  formatIcsDateTime,
  foldIcsLine,
  buildIcsCalendar,
  buildVEvent,
} from '../icsBuilder.js';
import type { IcsVEventInput } from '../icsBuilder.js';
import { GameStatus } from '../../types/gameEnums.js';
import type { dbGameInfo } from '../../repositories/index.js';

const makeGame = (overrides: Partial<dbGameInfo> = {}): dbGameInfo =>
  ({
    id: 1n,
    gamedate: new Date('2025-06-15T18:00:00Z'),
    hteamid: 10n,
    vteamid: 20n,
    leagueid: 5n,
    fieldid: null,
    hscore: null,
    vscore: null,
    gamestatus: GameStatus.Scheduled,
    gametype: 0,
    comment: null,
    umpire1: null,
    umpire2: null,
    umpire3: null,
    umpire4: null,
    availablefields: null,
    hometeam: { id: 10n, name: 'Home Team' },
    visitingteam: { id: 20n, name: 'Visitor Team' },
    leagueseason: { id: 5n, league: { name: 'Test League' } },
    _count: { gamerecap: 0 },
    ...overrides,
  }) as dbGameInfo;

const makeVEventInput = (
  game: dbGameInfo,
  overrides: Partial<IcsVEventInput> = {},
): IcsVEventInput => ({
  game,
  dtstamp: '20250101T000000Z',
  gameDurationMinutes: 180,
  uidDomain: 'draco.local',
  leagueName: 'Test League',
  ...overrides,
});

describe('escapeIcsText', () => {
  it('escapes backslashes', () => {
    expect(escapeIcsText('a\\b')).toBe('a\\\\b');
  });

  it('escapes newlines', () => {
    expect(escapeIcsText('line1\nline2')).toBe('line1\\nline2');
  });

  it('escapes commas', () => {
    expect(escapeIcsText('a,b')).toBe('a\\,b');
  });

  it('escapes semicolons', () => {
    expect(escapeIcsText('a;b')).toBe('a\\;b');
  });

  it('handles all special characters together', () => {
    expect(escapeIcsText('a\\,;b')).toBe('a\\\\\\,\\;b');
  });

  it('strips carriage returns', () => {
    expect(escapeIcsText('a\r\nb')).toBe('a\\nb');
  });
});

describe('formatIcsDateTime', () => {
  it('formats a UTC date with trailing Z', () => {
    const d = new Date('2025-06-15T18:30:00Z');
    const result = formatIcsDateTime(d);
    expect(result).toBe('20250615T183000Z');
  });

  it('always ends with Z', () => {
    const d = new Date('2000-01-01T00:00:00Z');
    expect(formatIcsDateTime(d)).toMatch(/Z$/);
  });

  it('pads single-digit months and days', () => {
    const d = new Date('2025-01-05T09:07:03Z');
    expect(formatIcsDateTime(d)).toBe('20250105T090703Z');
  });
});

describe('foldIcsLine', () => {
  it('does not fold lines at or under 75 octets', () => {
    const short = 'SUMMARY:Short title';
    expect(foldIcsLine(short)).toBe(short);
  });

  it('folds at 75 octets with CRLF + space continuation', () => {
    const line = 'SUMMARY:' + 'A'.repeat(80);
    const folded = foldIcsLine(line);
    expect(folded).toContain('\r\n ');
    const parts = folded.split('\r\n ');
    expect(parts.length).toBeGreaterThan(1);
    const encoder = new TextEncoder();
    expect(encoder.encode(parts[0]).length).toBeLessThanOrEqual(75);
  });

  it('is multibyte safe with emoji characters', () => {
    const emoji = '😀';
    const line = 'SUMMARY:' + emoji.repeat(20);
    const folded = foldIcsLine(line);
    const encoder = new TextEncoder();
    const parts = folded.split('\r\n ');
    for (const part of parts) {
      expect(encoder.encode(part).length).toBeLessThanOrEqual(75);
    }
  });

  it('is multibyte safe with accented characters', () => {
    const line = 'SUMMARY:' + 'é'.repeat(50);
    const folded = foldIcsLine(line);
    const encoder = new TextEncoder();
    const parts = folded.split('\r\n ');
    for (const part of parts) {
      expect(encoder.encode(part).length).toBeLessThanOrEqual(75);
    }
  });
});

describe('buildVEvent', () => {
  it('includes required fields', () => {
    const game = makeGame();
    const event = buildVEvent(makeVEventInput(game));
    expect(event).toContain('BEGIN:VEVENT');
    expect(event).toContain('END:VEVENT');
    expect(event).toContain('UID:game-1@draco.local');
    expect(event).toContain('DTSTAMP:20250101T000000Z');
    expect(event).toContain('DTSTART:20250615T180000Z');
    expect(event).toContain('DTEND:20250615T210000Z');
    expect(event).toContain('SUMMARY:Test League: Visitor Team @ Home Team');
  });

  it('omits LOCATION when availablefields is null', () => {
    const game = makeGame({ availablefields: null });
    const event = buildVEvent(makeVEventInput(game));
    expect(event).not.toContain('LOCATION:');
  });

  it('includes LOCATION when field exists', () => {
    const game = makeGame({
      availablefields: {
        id: 1n,
        accountid: 1n,
        name: 'Main Field',
        shortname: 'MF',
        comment: '',
        address: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zipcode: '62701',
        directions: '',
        rainoutnumber: '',
        latitude: '',
        longitude: '',
        haslights: false,
        maxparallelgames: 1,
        scheduleenabled: false,
        gamelengthminutes: null,
        bufferminutes: 0,
      },
    });
    const event = buildVEvent(makeVEventInput(game));
    expect(event).toContain('LOCATION:');
    expect(event).toContain('Main Field');
  });

  it('DTSTART and DTEND always end with Z', () => {
    const game = makeGame();
    const event = buildVEvent(makeVEventInput(game));
    const dtstart = event.match(/DTSTART:(\S+)/)?.[1];
    const dtend = event.match(/DTEND:(\S+)/)?.[1];
    expect(dtstart).toMatch(/Z$/);
    expect(dtend).toMatch(/Z$/);
  });

  it('maps Scheduled to CONFIRMED', () => {
    const game = makeGame({ gamestatus: GameStatus.Scheduled });
    expect(buildVEvent(makeVEventInput(game))).toContain('STATUS:CONFIRMED');
  });

  it('maps Completed to CONFIRMED', () => {
    const game = makeGame({ gamestatus: GameStatus.Completed });
    expect(buildVEvent(makeVEventInput(game))).toContain('STATUS:CONFIRMED');
  });

  it('maps Rainout to CANCELLED', () => {
    const game = makeGame({ gamestatus: GameStatus.Rainout });
    expect(buildVEvent(makeVEventInput(game))).toContain('STATUS:CANCELLED');
  });

  it('maps Postponed to CANCELLED', () => {
    const game = makeGame({ gamestatus: GameStatus.Postponed });
    expect(buildVEvent(makeVEventInput(game))).toContain('STATUS:CANCELLED');
  });

  it('maps Forfeit to CONFIRMED', () => {
    const game = makeGame({ gamestatus: GameStatus.Forfeit });
    expect(buildVEvent(makeVEventInput(game))).toContain('STATUS:CONFIRMED');
  });

  it('maps DidNotReport to CONFIRMED', () => {
    const game = makeGame({ gamestatus: GameStatus.DidNotReport });
    expect(buildVEvent(makeVEventInput(game))).toContain('STATUS:CONFIRMED');
  });

  it('emits SEQUENCE:0 regardless of game data', () => {
    const games: dbGameInfo[] = [
      makeGame(),
      makeGame({ id: 999n, hscore: 5, vscore: 2, gamestatus: GameStatus.Completed }),
      makeGame({ id: 1234567890n, comment: 'rescheduled twice' }),
    ];
    for (const game of games) {
      const event = buildVEvent(makeVEventInput(game));
      expect(event).toContain('SEQUENCE:0');
    }
  });

  it('omits league name from SUMMARY when leagueName is null', () => {
    const game = makeGame();
    const event = buildVEvent(makeVEventInput(game, { leagueName: null }));
    expect(event).toContain('SUMMARY:Visitor Team @ Home Team');
    expect(event).not.toContain('Test League:');
  });
});

describe('buildIcsCalendar', () => {
  it('contains VERSION:2.0', () => {
    const result = buildIcsCalendar({ calendarName: 'Test', events: [] });
    expect(result).toContain('VERSION:2.0');
  });

  it('contains the default PRODID', () => {
    const result = buildIcsCalendar({ calendarName: 'Test', events: [] });
    expect(result).toContain('PRODID:-//Draco Sports Manager//Team Calendar Feed//EN');
  });

  it('contains METHOD:PUBLISH', () => {
    const result = buildIcsCalendar({ calendarName: 'Test', events: [] });
    expect(result).toContain('METHOD:PUBLISH');
  });

  it('contains X-WR-CALNAME and NAME', () => {
    const result = buildIcsCalendar({ calendarName: 'My Team Schedule', events: [] });
    expect(result).toContain('X-WR-CALNAME:My Team Schedule');
    expect(result).toContain('NAME:My Team Schedule');
  });

  it('contains BEGIN:VCALENDAR and END:VCALENDAR', () => {
    const result = buildIcsCalendar({ calendarName: 'Test', events: [] });
    expect(result).toContain('BEGIN:VCALENDAR');
    expect(result).toContain('END:VCALENDAR');
  });

  it('uses custom prodId when provided', () => {
    const result = buildIcsCalendar({
      calendarName: 'Test',
      events: [],
      prodId: '-//Custom//EN',
    });
    expect(result).toContain('PRODID:-//Custom//EN');
  });

  it('includes events between VCALENDAR delimiters', () => {
    const eventBlock = 'BEGIN:VEVENT\r\nUID:test@draco.local\r\nEND:VEVENT';
    const result = buildIcsCalendar({ calendarName: 'Test', events: [eventBlock] });
    expect(result).toContain(eventBlock);
    const beginIdx = result.indexOf('BEGIN:VCALENDAR');
    const endIdx = result.indexOf('END:VCALENDAR');
    const veventIdx = result.indexOf('BEGIN:VEVENT');
    expect(veventIdx).toBeGreaterThan(beginIdx);
    expect(veventIdx).toBeLessThan(endIdx);
  });

  it('folds each event line independently, never splitting property names from values', () => {
    const game = makeGame({
      availablefields: {
        id: 1n,
        accountid: 1n,
        name: 'Some Long Field Name',
        shortname: 'SLFN',
        comment: '',
        address: '12345 Long Street Address',
        city: 'A City With A Long Name',
        state: 'MI',
        zipcode: '48082',
        directions: '',
        rainoutnumber: '',
        latitude: '',
        longitude: '',
        haslights: false,
        maxparallelgames: 1,
        scheduleenabled: false,
        gamelengthminutes: null,
        bufferminutes: 0,
      },
    });
    const event = buildVEvent(makeVEventInput(game));
    const result = buildIcsCalendar({ calendarName: 'Cardinals Schedule (2025)', events: [event] });

    expect(result).not.toMatch(/DTSTART\r\n /);
    expect(result).not.toMatch(/DTEND\r\n /);
    expect(result).not.toMatch(/DTSTAMP\r\n /);
    expect(result).not.toMatch(/STATUS\r\n /);
    expect(result).not.toMatch(/UID\r\n /);
    expect(result).not.toMatch(/SEQUENCE\r\n /);
    expect(result).not.toMatch(/SUMMARY\r\n /);
    expect(result).not.toMatch(/LOCATION\r\n /);

    expect(result).toMatch(/\r\nDTSTART:\d{8}T\d{6}Z\r\n/);
    expect(result).toMatch(/\r\nDTEND:\d{8}T\d{6}Z\r\n/);
  });

  it('folds long individual lines correctly within an event', () => {
    const game = makeGame({
      hometeam: { id: 10n, name: 'A'.repeat(40) },
      visitingteam: { id: 20n, name: 'B'.repeat(40) },
    });
    const event = buildVEvent(makeVEventInput(game));
    const result = buildIcsCalendar({ calendarName: 'Test', events: [event] });

    const encoder = new TextEncoder();
    const lines = result.split('\r\n');
    for (const line of lines) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    }

    const summaryLineStart = lines.findIndex((l) => l.startsWith('SUMMARY:'));
    expect(summaryLineStart).toBeGreaterThan(-1);
    expect(lines[summaryLineStart + 1]).toMatch(/^ /);
  });
});
