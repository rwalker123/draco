import { describe, it, expect } from 'vitest';
import { DateUtils } from '../dateUtils.js';

describe('DateUtils.formatIsoDateInTimeZone', () => {
  const eveningEstGameDate = new Date('2025-06-11T00:30:00Z');

  it('returns the local calendar date for an evening EST game', () => {
    expect(DateUtils.formatIsoDateInTimeZone(eveningEstGameDate, 'America/New_York')).toBe(
      '2025-06-10',
    );
  });

  it('returns the UTC calendar date when timezone is UTC', () => {
    expect(DateUtils.formatIsoDateInTimeZone(eveningEstGameDate, 'UTC')).toBe('2025-06-11');
  });

  it('defaults to UTC when no timezone is provided', () => {
    expect(DateUtils.formatIsoDateInTimeZone(eveningEstGameDate)).toBe('2025-06-11');
  });

  it('returns null for missing dates', () => {
    expect(DateUtils.formatIsoDateInTimeZone(null, 'America/New_York')).toBeNull();
    expect(DateUtils.formatIsoDateInTimeZone(undefined)).toBeNull();
  });
});
