import { describe, expect, it } from 'vitest';
import { utcIsoToZonedInputValue, zonedInputValueToUtcIso } from '../schedulerTimeFormat';

describe('scheduler datetime-local <-> UTC conversion', () => {
  it('renders a UTC instant as the wall clock in the target time zone', () => {
    // 13:00Z is 09:00 EDT on 2026-04-05 (America/New_York, UTC-4 in April).
    expect(utcIsoToZonedInputValue('2026-04-05T13:00:00Z', 'America/New_York')).toBe(
      '2026-04-05T09:00',
    );
    // UTC zone shows the same wall clock.
    expect(utcIsoToZonedInputValue('2026-04-05T13:00:00Z', 'UTC')).toBe('2026-04-05T13:00');
  });

  it('converts a zoned wall clock back to the correct UTC instant', () => {
    expect(zonedInputValueToUtcIso('2026-04-05T09:00', 'America/New_York')).toBe(
      '2026-04-05T13:00:00.000Z',
    );
    expect(zonedInputValueToUtcIso('2026-04-05T13:00', 'UTC')).toBe('2026-04-05T13:00:00.000Z');
  });

  it('round-trips a UTC instant through the zoned input value', () => {
    const zones = ['America/New_York', 'America/Los_Angeles', 'UTC', 'America/Chicago'];
    const iso = '2026-07-04T23:30:00.000Z';
    for (const zone of zones) {
      const input = utcIsoToZonedInputValue(iso, zone);
      expect(zonedInputValueToUtcIso(input, zone)).toBe(iso);
    }
  });

  it('returns empty/null for invalid input', () => {
    expect(utcIsoToZonedInputValue('not-a-date', 'UTC')).toBe('');
    expect(zonedInputValueToUtcIso('garbage', 'UTC')).toBeNull();
  });
});
