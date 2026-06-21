import { describe, expect, it } from 'vitest';
import { dateInputToIso, isoToDateInput } from '../schedulerBlackoutDate';
import { getDateKeyInTimezone } from '../dateUtils';

describe('dateInputToIso', () => {
  const cases: Array<{ zone: string; dateStr: string }> = [
    { zone: 'Pacific/Kiritimati', dateStr: '2026-06-15' },
    { zone: 'Pacific/Auckland', dateStr: '2026-06-15' },
    { zone: 'America/New_York', dateStr: '2026-06-15' },
    { zone: 'UTC', dateStr: '2026-06-15' },
  ];

  it.each(cases)('keeps the start boundary on $dateStr in $zone', ({ zone, dateStr }) => {
    const iso = dateInputToIso(dateStr, zone, 'start');
    expect(getDateKeyInTimezone(iso, zone)).toBe(dateStr);
  });

  it.each(cases)('keeps the end boundary on $dateStr in $zone', ({ zone, dateStr }) => {
    const iso = dateInputToIso(dateStr, zone, 'end');
    expect(getDateKeyInTimezone(iso, zone)).toBe(dateStr);
  });

  it('round-trips through isoToDateInput for far-east zones', () => {
    const zone = 'Pacific/Kiritimati';
    const iso = dateInputToIso('2026-06-15', zone, 'start');
    expect(isoToDateInput(iso, zone)).toBe('2026-06-15');
  });

  it('throws on an unparseable key (invalid instant)', () => {
    expect(() => dateInputToIso('not-a-date', 'UTC', 'start')).toThrow();
  });
});
