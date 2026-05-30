import { describe, it, expect } from 'vitest';
import {
  resolveGameDateWindow,
  localDateBounds,
  filterGamesByLocalDate,
  localDateInTimeZone,
} from '../../tools/helpers/resolveGameDateWindow.js';

describe('localDateInTimeZone', () => {
  it('returns the local calendar date in the given timezone, not UTC', () => {
    const instant = '2026-03-09T03:30:00.000Z';
    expect(localDateInTimeZone(instant, 'America/Chicago')).toBe('2026-03-08');
    expect(localDateInTimeZone(instant, 'UTC')).toBe('2026-03-09');
    expect(localDateInTimeZone(instant, 'Pacific/Kiritimati')).toBe('2026-03-09');
  });

  it('rolls the local date forward for far-east timezones (UTC+14)', () => {
    const lateUtc = '2026-03-09T11:00:00.000Z';
    expect(localDateInTimeZone(lateUtc, 'Pacific/Kiritimati')).toBe('2026-03-10');
    expect(localDateInTimeZone(lateUtc, 'UTC')).toBe('2026-03-09');
  });
});

describe('resolveGameDateWindow', () => {
  describe("range='today'", () => {
    it('targets the local day and pads the UTC query window by ±1 day', () => {
      const now = new Date('2026-06-15T18:00:00.000Z');
      const win = resolveGameDateWindow({ range: 'today', timezone: 'America/Chicago', now });

      expect(win.localStart).toBe('2026-06-15');
      expect(win.localEnd).toBe('2026-06-15');
      expect(win.startDate).toBe('2026-06-14T00:00:00.000Z');
      expect(win.endDate).toBe('2026-06-16T23:59:59.999Z');
    });

    it("uses the account timezone's calendar day, which can differ from UTC", () => {
      const now = new Date('2026-06-15T02:00:00.000Z');
      const chicago = resolveGameDateWindow({ range: 'today', timezone: 'America/Chicago', now });
      const utc = resolveGameDateWindow({ range: 'today', timezone: 'UTC', now });

      expect(chicago.localStart).toBe('2026-06-14');
      expect(utc.localStart).toBe('2026-06-15');
    });

    it('treats tonight as the same local day as today', () => {
      const now = new Date('2026-06-15T18:00:00.000Z');
      const today = resolveGameDateWindow({ range: 'today', timezone: 'UTC', now });
      const tonight = resolveGameDateWindow({ range: 'tonight', timezone: 'UTC', now });
      expect(tonight.localStart).toBe(today.localStart);
      expect(tonight.localEnd).toBe(today.localEnd);
    });
  });

  describe("range='tomorrow'", () => {
    it('targets the next local day', () => {
      const now = new Date('2026-06-15T18:00:00.000Z');
      const win = resolveGameDateWindow({ range: 'tomorrow', timezone: 'UTC', now });
      expect(win.localStart).toBe('2026-06-16');
      expect(win.localEnd).toBe('2026-06-16');
      expect(win.startDate).toBe('2026-06-15T00:00:00.000Z');
      expect(win.endDate).toBe('2026-06-17T23:59:59.999Z');
    });

    it('rolls over month boundaries', () => {
      const now = new Date('2026-06-30T18:00:00.000Z');
      const win = resolveGameDateWindow({ range: 'tomorrow', timezone: 'UTC', now });
      expect(win.localStart).toBe('2026-07-01');
    });
  });

  describe("range='this_week'", () => {
    it('spans seven consecutive local days starting today', () => {
      const now = new Date('2026-06-15T18:00:00.000Z');
      const win = resolveGameDateWindow({ range: 'this_week', timezone: 'UTC', now });
      expect(win.localStart).toBe('2026-06-15');
      expect(win.localEnd).toBe('2026-06-21');
      expect(win.startDate).toBe('2026-06-14T00:00:00.000Z');
      expect(win.endDate).toBe('2026-06-22T23:59:59.999Z');
    });
  });

  describe("range='this_weekend'", () => {
    it('targets the upcoming Saturday and Sunday on a weekday', () => {
      const wednesday = new Date('2026-06-17T18:00:00.000Z');
      const win = resolveGameDateWindow({ range: 'this_weekend', timezone: 'UTC', now: wednesday });
      expect(win.localStart).toBe('2026-06-20');
      expect(win.localEnd).toBe('2026-06-21');
    });

    it('includes today and Sunday when today is Saturday', () => {
      const saturday = new Date('2026-06-20T18:00:00.000Z');
      const win = resolveGameDateWindow({ range: 'this_weekend', timezone: 'UTC', now: saturday });
      expect(win.localStart).toBe('2026-06-20');
      expect(win.localEnd).toBe('2026-06-21');
    });

    it('includes only today when today is Sunday', () => {
      const sunday = new Date('2026-06-21T18:00:00.000Z');
      const win = resolveGameDateWindow({ range: 'this_weekend', timezone: 'UTC', now: sunday });
      expect(win.localStart).toBe('2026-06-21');
      expect(win.localEnd).toBe('2026-06-21');
    });
  });

  describe('explicit from/to (delegates to localDateBounds)', () => {
    it('pads the UTC query window while keeping the local bounds tight', () => {
      const now = new Date('2026-06-15T18:00:00.000Z');
      const win = resolveGameDateWindow({
        from: '2026-05-01',
        to: '2026-05-29',
        timezone: 'America/New_York',
        now,
      });
      expect(win.localStart).toBe('2026-05-01');
      expect(win.localEnd).toBe('2026-05-29');
      expect(win.startDate).toBe('2026-04-30T00:00:00.000Z');
      expect(win.endDate).toBe('2026-05-30T23:59:59.999Z');
    });
  });
});

describe('localDateBounds', () => {
  it('pads each provided bound by a day and records the tight local bounds', () => {
    const win = localDateBounds('2026-05-01', '2026-05-29');
    expect(win.startDate).toBe('2026-04-30T00:00:00.000Z');
    expect(win.endDate).toBe('2026-05-30T23:59:59.999Z');
    expect(win.localStart).toBe('2026-05-01');
    expect(win.localEnd).toBe('2026-05-29');
  });

  it('leaves an open-ended bound undefined', () => {
    expect(localDateBounds('2026-07-01', undefined)).toEqual({
      startDate: '2026-06-30T00:00:00.000Z',
      endDate: undefined,
      localStart: '2026-07-01',
      localEnd: undefined,
    });
    expect(localDateBounds(undefined, '2026-07-31')).toEqual({
      startDate: undefined,
      endDate: '2026-08-01T23:59:59.999Z',
      localStart: undefined,
      localEnd: '2026-07-31',
    });
  });
});

describe('filterGamesByLocalDate', () => {
  const tz = 'America/New_York';

  it('returns games unchanged when no bounds are given', () => {
    const games = [{ gameDate: '2026-05-29T23:30:00-04:00' }];
    expect(filterGamesByLocalDate(games, tz)).toBe(games);
  });

  it('keeps a Friday-night ET game whose UTC date is the next day for to=that Friday', () => {
    // Fri 2026-05-29 8:15 PM ET == 2026-05-30 00:15 UTC.
    const fridayNightGame = { id: 'fri', gameDate: '2026-05-30T00:15:00.000Z' };
    const saturdayGame = { id: 'sat', gameDate: '2026-05-30T18:00:00.000Z' };

    expect(localDateInTimeZone(fridayNightGame.gameDate, tz)).toBe('2026-05-29');
    expect(localDateInTimeZone(saturdayGame.gameDate, tz)).toBe('2026-05-30');

    const kept = filterGamesByLocalDate(
      [fridayNightGame, saturdayGame],
      tz,
      undefined,
      '2026-05-29',
    );
    expect(kept.map((g) => g.id)).toEqual(['fri']);
  });

  it('excludes games before the local lower bound', () => {
    const games = [
      { id: 'apr30', gameDate: '2026-04-30T18:00:00.000Z' },
      { id: 'may01', gameDate: '2026-05-01T18:00:00.000Z' },
    ];
    const kept = filterGamesByLocalDate(games, tz, '2026-05-01', undefined);
    expect(kept.map((g) => g.id)).toEqual(['may01']);
  });

  describe('DST boundary (America/Chicago spring forward 2026-03-08)', () => {
    it('keeps a late-evening local game and drops a genuine next-local-day game', () => {
      const win = resolveGameDateWindow({
        range: 'today',
        timezone: 'America/Chicago',
        now: new Date('2026-03-08T12:00:00.000Z'),
      });

      const lateEvening = { id: 'late', gameDate: '2026-03-09T04:30:00.000Z' }; // 23:30 CDT Mar 8
      const afterMidnight = { id: 'next', gameDate: '2026-03-09T06:00:00.000Z' }; // 01:00 CDT Mar 9

      expect(localDateInTimeZone(lateEvening.gameDate, 'America/Chicago')).toBe('2026-03-08');
      expect(localDateInTimeZone(afterMidnight.gameDate, 'America/Chicago')).toBe('2026-03-09');

      const kept = filterGamesByLocalDate(
        [lateEvening, afterMidnight],
        'America/Chicago',
        win.localStart,
        win.localEnd,
      );
      expect(kept.map((g) => g.id)).toEqual(['late']);
    });
  });
});
