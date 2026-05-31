import { describe, expect, it } from 'vitest';
import type { FieldClosedDateType, FieldOpenHourType } from '@draco/shared-schemas';
import {
  buildDraftDays,
  buildDraftClosedDates,
  buildOpenHoursPayload,
  buildClosedDatesPayload,
  applyQuickSetToDays,
  groupOpenHoursLabel,
  formatMinutesAsHoursMinutes,
} from '../SchedulerFieldsConfig';
import { DAYS } from '../../../utils/daysOfWeekUtils';

const makeOpenHour = (
  dayOfWeek: number,
  startTimeLocal: string,
  endTimeLocal: string,
): FieldOpenHourType => ({
  id: `oh-${dayOfWeek}`,
  dayOfWeek,
  startTimeLocal,
  endTimeLocal,
});

const makeClosedDate = (date: string, note?: string): FieldClosedDateType => ({
  id: `cd-${date}`,
  date,
  note: note ?? null,
});

describe('buildDraftDays', () => {
  it('marks all 7 days as closed when openHours is empty', () => {
    const result = buildDraftDays([]);

    expect(result.size).toBe(7);
    for (const day of DAYS) {
      expect(result.get(day.bit)?.open).toBe(false);
    }
  });

  it('marks open days with their exact times', () => {
    const result = buildDraftDays([
      makeOpenHour(0, '09:00', '21:00'),
      makeOpenHour(5, '08:00', '17:00'),
    ]);

    expect(result.get(0)).toEqual({ open: true, start: '09:00', end: '21:00' });
    expect(result.get(5)).toEqual({ open: true, start: '08:00', end: '17:00' });
  });

  it('leaves days not in openHours as closed with default times', () => {
    const result = buildDraftDays([makeOpenHour(1, '10:00', '20:00')]);

    expect(result.get(0)?.open).toBe(false);
    expect(result.get(2)?.open).toBe(false);
    expect(result.get(6)?.open).toBe(false);
  });

  it('round-trips: openHours → buildDraftDays → buildOpenHoursPayload produces same shape', () => {
    const input: FieldOpenHourType[] = [
      makeOpenHour(0, '09:00', '21:00'),
      makeOpenHour(2, '10:00', '18:00'),
      makeOpenHour(5, '08:00', '20:00'),
    ];

    const draftDays = buildDraftDays(input);
    const payload = buildOpenHoursPayload(draftDays);

    expect(payload).toHaveLength(3);
    expect(payload).toContainEqual({
      dayOfWeek: 0,
      startTimeLocal: '09:00',
      endTimeLocal: '21:00',
    });
    expect(payload).toContainEqual({
      dayOfWeek: 2,
      startTimeLocal: '10:00',
      endTimeLocal: '18:00',
    });
    expect(payload).toContainEqual({
      dayOfWeek: 5,
      startTimeLocal: '08:00',
      endTimeLocal: '20:00',
    });
  });
});

describe('buildOpenHoursPayload', () => {
  it('only includes days that are marked as open', () => {
    const draftDays = buildDraftDays([]);
    draftDays.set(1, { open: true, start: '10:00', end: '18:00' });
    draftDays.set(3, { open: false, start: '09:00', end: '17:00' });

    const payload = buildOpenHoursPayload(draftDays);

    expect(payload).toHaveLength(1);
    expect(payload[0].dayOfWeek).toBe(1);
  });

  it('preserves start/end times for open days in Mon-Sun order', () => {
    const draftDays = buildDraftDays([]);
    draftDays.set(6, { open: true, start: '12:00', end: '16:00' });
    draftDays.set(0, { open: true, start: '09:00', end: '21:00' });

    const payload = buildOpenHoursPayload(draftDays);

    expect(payload).toHaveLength(2);
    const mon = payload.find((h) => h.dayOfWeek === 0);
    const sun = payload.find((h) => h.dayOfWeek === 6);
    expect(mon?.startTimeLocal).toBe('09:00');
    expect(sun?.startTimeLocal).toBe('12:00');
  });

  it('produces empty array when all days are closed', () => {
    const draftDays = buildDraftDays([]);
    expect(buildOpenHoursPayload(draftDays)).toHaveLength(0);
  });
});

describe('buildDraftClosedDates', () => {
  it('returns empty array for no closed dates', () => {
    expect(buildDraftClosedDates([])).toHaveLength(0);
  });

  it('maps closed dates to draft form with note defaulting to empty string', () => {
    const result = buildDraftClosedDates([
      makeClosedDate('2026-07-04', 'Independence Day'),
      makeClosedDate('2026-12-25'),
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2026-07-04');
    expect(result[0].note).toBe('Independence Day');
    expect(result[1].date).toBe('2026-12-25');
    expect(result[1].note).toBe('');
  });

  it('assigns unique keys so React lists have stable identity', () => {
    const result = buildDraftClosedDates([
      makeClosedDate('2026-07-04'),
      makeClosedDate('2026-08-01'),
    ]);

    const keys = result.map((cd) => cd.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('buildClosedDatesPayload', () => {
  it('filters out entries with empty dates', () => {
    const payload = buildClosedDatesPayload([
      { key: 'a', date: '', endDate: '', note: '' },
      { key: 'b', date: '2026-07-04', endDate: '', note: '' },
    ]);

    expect(payload).toHaveLength(1);
    expect(payload[0].date).toBe('2026-07-04');
  });

  it('omits note when empty', () => {
    const payload = buildClosedDatesPayload([
      { key: 'a', date: '2026-07-04', endDate: '', note: '' },
    ]);

    expect(payload[0].note).toBeUndefined();
  });

  it('includes note when provided', () => {
    const payload = buildClosedDatesPayload([
      { key: 'a', date: '2026-07-04', endDate: '', note: 'Holiday' },
    ]);

    expect(payload[0].note).toBe('Holiday');
  });

  it('trims whitespace from date and note', () => {
    const payload = buildClosedDatesPayload([
      { key: 'a', date: '  2026-07-04  ', endDate: '', note: '  Holiday  ' },
    ]);

    expect(payload[0].date).toBe('2026-07-04');
    expect(payload[0].note).toBe('Holiday');
  });

  it('includes endDate only when it differs from the start date', () => {
    const payload = buildClosedDatesPayload([
      { key: 'a', date: '2026-07-04', endDate: '2026-07-06', note: '' },
      { key: 'b', date: '2026-08-01', endDate: '2026-08-01', note: '' },
      { key: 'c', date: '2026-09-01', endDate: '', note: '' },
    ]);

    expect(payload[0].endDate).toBe('2026-07-06');
    expect(payload[1].endDate).toBeUndefined();
    expect(payload[2].endDate).toBeUndefined();
  });
});

describe('applyQuickSetToDays', () => {
  const weekdayBits = DAYS.filter((d) => d.bit <= 4).map((d) => d.bit);
  const weekendBits = DAYS.filter((d) => d.bit >= 5).map((d) => d.bit);
  const allBits = DAYS.map((d) => d.bit);

  it('Weekdays quick-set opens Mon–Fri and closes Sat–Sun', () => {
    const initial = buildDraftDays([]);
    const result = applyQuickSetToDays(initial, weekdayBits, '09:00', '21:00');

    expect(result.get(0)?.open).toBe(true);
    expect(result.get(4)?.open).toBe(true);
    expect(result.get(5)?.open).toBe(false);
    expect(result.get(6)?.open).toBe(false);
  });

  it('Weekends quick-set opens Sat–Sun and closes Mon–Fri', () => {
    const initial = buildDraftDays([makeOpenHour(0, '10:00', '20:00')]);
    const result = applyQuickSetToDays(initial, weekendBits, '08:00', '17:00');

    expect(result.get(5)?.open).toBe(true);
    expect(result.get(6)?.open).toBe(true);
    expect(result.get(0)?.open).toBe(false);
    expect(result.get(4)?.open).toBe(false);
  });

  it('All days quick-set opens all 7 days with the provided times', () => {
    const initial = buildDraftDays([]);
    const result = applyQuickSetToDays(initial, allBits, '06:00', '22:00');

    for (const day of DAYS) {
      expect(result.get(day.bit)).toEqual({ open: true, start: '06:00', end: '22:00' });
    }
  });

  it('applies the quickStart/quickEnd time range to all opened days', () => {
    const initial = buildDraftDays([]);
    const result = applyQuickSetToDays(initial, [1, 2, 3], '11:00', '19:00');

    expect(result.get(1)).toEqual({ open: true, start: '11:00', end: '19:00' });
    expect(result.get(2)).toEqual({ open: true, start: '11:00', end: '19:00' });
    expect(result.get(3)).toEqual({ open: true, start: '11:00', end: '19:00' });
  });

  it('does not mutate the original DraftDayMap', () => {
    const initial = buildDraftDays([makeOpenHour(0, '09:00', '21:00')]);
    const originalEntry = initial.get(0);

    applyQuickSetToDays(initial, weekdayBits, '10:00', '20:00');

    expect(initial.get(0)).toEqual(originalEntry);
  });
});

describe('formatMinutesAsHoursMinutes', () => {
  it('formats minutes as H:MM with zero-padded minutes', () => {
    expect(formatMinutesAsHoursMinutes(90)).toBe('1:30');
    expect(formatMinutesAsHoursMinutes(120)).toBe('2:00');
    expect(formatMinutesAsHoursMinutes(45)).toBe('0:45');
    expect(formatMinutesAsHoursMinutes(60)).toBe('1:00');
    expect(formatMinutesAsHoursMinutes(0)).toBe('0:00');
  });
});

describe('groupOpenHoursLabel', () => {
  it('returns an empty string when array is empty', () => {
    expect(groupOpenHoursLabel([])).toBe('');
  });

  it('labels a single open day correctly', () => {
    const label = groupOpenHoursLabel([makeOpenHour(0, '09:00', '21:00')]);

    expect(label).toContain('Mon');
    expect(label).toContain('9:00 AM');
    expect(label).toContain('9:00 PM');
  });

  it('groups consecutive days with the same time into a range', () => {
    const label = groupOpenHoursLabel([
      makeOpenHour(0, '09:00', '21:00'),
      makeOpenHour(1, '09:00', '21:00'),
      makeOpenHour(2, '09:00', '21:00'),
      makeOpenHour(3, '09:00', '21:00'),
      makeOpenHour(4, '09:00', '21:00'),
    ]);

    expect(label).toContain('Mon–Fri');
    expect(label).not.toContain('Tue');
    expect(label).not.toContain('Wed');
  });

  it('does not group days with different times into one segment', () => {
    const label = groupOpenHoursLabel([
      makeOpenHour(0, '09:00', '21:00'),
      makeOpenHour(1, '10:00', '18:00'),
    ]);

    expect(label).toContain('Mon');
    expect(label).toContain('Tue');
    expect(label).toContain('·');
  });

  it('does not group non-consecutive days even if times match', () => {
    const label = groupOpenHoursLabel([
      makeOpenHour(0, '09:00', '21:00'),
      makeOpenHour(2, '09:00', '21:00'),
    ]);

    expect(label).toContain('Mon');
    expect(label).toContain('Wed');
    expect(label).toContain('·');
  });

  it('handles weekend-only open hours', () => {
    const label = groupOpenHoursLabel([
      makeOpenHour(5, '09:00', '17:00'),
      makeOpenHour(6, '09:00', '17:00'),
    ]);

    expect(label).toContain('Sat–Sun');
  });
});

describe('scheduleEnabled toggle preserves existing hours (round-trip invariant)', () => {
  it('toggling scheduleEnabled sends the exact same openHours back', () => {
    const originalOpenHours: FieldOpenHourType[] = [
      makeOpenHour(0, '09:00', '21:00'),
      makeOpenHour(5, '08:00', '17:00'),
    ];

    const draftDays = buildDraftDays(originalOpenHours);
    const payloadOpenHours = buildOpenHoursPayload(draftDays);

    expect(payloadOpenHours).toHaveLength(2);
    expect(payloadOpenHours).toContainEqual({
      dayOfWeek: 0,
      startTimeLocal: '09:00',
      endTimeLocal: '21:00',
    });
    expect(payloadOpenHours).toContainEqual({
      dayOfWeek: 5,
      startTimeLocal: '08:00',
      endTimeLocal: '17:00',
    });
  });

  it('toggling scheduleEnabled with closed dates preserves them unchanged', () => {
    const originalClosedDates: FieldClosedDateType[] = [
      makeClosedDate('2026-07-04', 'Independence Day'),
      makeClosedDate('2026-12-25'),
    ];

    const draft = buildDraftClosedDates(originalClosedDates);
    const payload = buildClosedDatesPayload(draft);

    expect(payload).toHaveLength(2);
    expect(payload).toContainEqual({ date: '2026-07-04', note: 'Independence Day' });
    expect(payload).toContainEqual({ date: '2026-12-25' });
  });
});
