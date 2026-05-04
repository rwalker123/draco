import { describe, expect, it } from 'vitest';
import type { GameCardData } from '../../components/GameCard';
import {
  buildIcsContent,
  type CalendarEvent,
  gameToCalendarEvent,
  sanitizeIcsFilename,
} from '../calendar';

const sampleEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
  uid: 'game-123@draco',
  title: 'Eagles @ Hawks',
  start: new Date(Date.UTC(2026, 4, 4, 18, 30, 0)),
  end: new Date(Date.UTC(2026, 4, 4, 18, 30, 0)),
  location: 'Memorial Field',
  description: 'Regular season game',
  url: 'https://example.com/account/1/schedule',
  ...overrides,
});

const baseGame: GameCardData = {
  id: '42',
  date: '2026-05-04T18:30:00.000Z',
  homeTeamId: 'home-1',
  visitorTeamId: 'visitor-1',
  homeTeamName: 'Hawks',
  visitorTeamName: 'Eagles',
  homeScore: 0,
  visitorScore: 0,
  gameStatus: 0,
  gameStatusText: 'Scheduled',
  leagueName: 'AAA',
  fieldId: 'f1',
  fieldName: 'Memorial Field',
  fieldShortName: 'MF',
  hasGameRecap: false,
  gameRecaps: [],
};

describe('buildIcsContent', () => {
  it('produces a valid VCALENDAR envelope', () => {
    const ics = buildIcsContent([sampleEvent()]);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//Draco//Calendar//EN');
    expect(ics).toContain('CALSCALE:GREGORIAN');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('emits required event properties for each event', () => {
    const ics = buildIcsContent([sampleEvent()]);
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('UID:game-123@draco');
    expect(ics).toMatch(/DTSTAMP:\d{8}T\d{6}Z/);
    expect(ics).toContain('DTSTART:20260504T183000Z');
    expect(ics).toContain('DTEND:20260504T183000Z');
    expect(ics).toContain('SUMMARY:Eagles @ Hawks');
  });

  it('escapes commas, semicolons, backslashes, and newlines in text fields', () => {
    const ics = buildIcsContent([
      sampleEvent({
        title: 'Bring water, snacks; gear',
        description: 'Line one\nLine two; with a path C:\\Sports',
        location: 'Field 1, North Lot',
      }),
    ]);
    expect(ics).toContain('SUMMARY:Bring water\\, snacks\\; gear');
    expect(ics).toContain('LOCATION:Field 1\\, North Lot');
    expect(ics).toContain('DESCRIPTION:Line one\\nLine two\\; with a path C:\\\\Sports');
  });

  it('emits multiple VEVENT blocks in input order', () => {
    const ics = buildIcsContent([
      sampleEvent({ uid: 'a', title: 'First' }),
      sampleEvent({ uid: 'b', title: 'Second' }),
    ]);
    const blocks = ics.split('BEGIN:VEVENT').slice(1);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toContain('UID:a');
    expect(blocks[0]).toContain('SUMMARY:First');
    expect(blocks[1]).toContain('UID:b');
    expect(blocks[1]).toContain('SUMMARY:Second');
  });

  it('folds lines longer than 75 octets per RFC 5545', () => {
    const longDescription = 'x'.repeat(200);
    const ics = buildIcsContent([sampleEvent({ description: longDescription })]);
    const descriptionLines = ics
      .split('\r\n')
      .filter((line) => line.startsWith('DESCRIPTION:') || line.startsWith(' '));
    expect(descriptionLines.length).toBeGreaterThan(1);
    for (const line of descriptionLines) {
      const byteLength = new TextEncoder().encode(line).length;
      expect(byteLength).toBeLessThanOrEqual(75);
    }
  });

  it('joins lines with CRLF', () => {
    const ics = buildIcsContent([sampleEvent()]);
    expect(ics.includes('\r\n')).toBe(true);
    expect(ics.includes('\n\n')).toBe(false);
  });

  it('terminates the final line with CRLF per RFC 5545', () => {
    const ics = buildIcsContent([sampleEvent()]);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });
});

describe('sanitizeIcsFilename', () => {
  it('lowercases and replaces non-alphanumeric runs with single underscore', () => {
    expect(sanitizeIcsFilename('Spring 2026 Schedule!')).toBe('spring_2026_schedule');
  });

  it('strips path separators', () => {
    expect(sanitizeIcsFilename('teams/eagles\\hawks')).toBe('teams_eagles_hawks');
  });

  it('falls back to "calendar" for empty input', () => {
    expect(sanitizeIcsFilename('   ')).toBe('calendar');
    expect(sanitizeIcsFilename('!!!')).toBe('calendar');
  });
});

describe('gameToCalendarEvent', () => {
  it('builds Visitor @ Home title with league prefix', () => {
    const event = gameToCalendarEvent(baseGame, {
      origin: 'https://example.com',
      pageHref: '/account/1/schedule',
    });
    expect(event.title).toBe('AAA: Eagles @ Hawks');
  });

  it('produces a zero-duration event matching the workouts pattern', () => {
    const event = gameToCalendarEvent(baseGame, {
      origin: 'https://example.com',
      pageHref: '/account/1/schedule',
    });
    expect(event.start.toISOString()).toBe(event.end.toISOString());
  });

  it('uses fieldDetails address when present', () => {
    const event = gameToCalendarEvent(
      {
        ...baseGame,
        fieldDetails: {
          id: 'f1',
          name: 'Memorial Field',
          shortName: 'MF',
          address: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zip: '62701',
        },
      },
      { origin: 'https://example.com', pageHref: '/account/1/schedule' },
    );
    expect(event.location).toBe('Memorial Field, 123 Main St, Springfield, IL 62701');
  });

  it('falls back to fieldName when fieldDetails is absent', () => {
    const event = gameToCalendarEvent(baseGame, {
      origin: 'https://example.com',
      pageHref: '/account/1/schedule',
    });
    expect(event.location).toBe('Memorial Field');
  });

  it('uses a stable UID derived from game id', () => {
    const event = gameToCalendarEvent(baseGame, {
      origin: 'https://example.com',
      pageHref: '/account/1/schedule',
    });
    expect(event.uid).toBe('game-42@draco');
  });

  it('builds URL from origin and pageHref', () => {
    const event = gameToCalendarEvent(baseGame, {
      origin: 'https://example.com',
      pageHref: '/account/1/schedule',
    });
    expect(event.url).toBe('https://example.com/account/1/schedule');
  });
});
