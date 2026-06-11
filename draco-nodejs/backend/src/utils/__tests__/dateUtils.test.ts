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

describe('DateUtils.formatTimeInTimeZone', () => {
  const eveningEstGameDate = new Date('2025-06-11T00:30:00Z');

  it('formats the time in the account timezone', () => {
    expect(DateUtils.formatTimeInTimeZone(eveningEstGameDate, 'America/New_York')).toBe('8:30 PM');
  });

  it('formats the time in UTC', () => {
    expect(DateUtils.formatTimeInTimeZone(eveningEstGameDate, 'UTC')).toBe('12:30 AM');
  });

  it('falls back to UTC for an invalid timezone', () => {
    expect(DateUtils.formatTimeInTimeZone(eveningEstGameDate, 'Not/AZone')).toBe('12:30 AM');
  });

  it('returns null for missing dates', () => {
    expect(DateUtils.formatTimeInTimeZone(null, 'America/New_York')).toBeNull();
    expect(DateUtils.formatTimeInTimeZone(undefined)).toBeNull();
  });
});

describe('DateUtils.formatMonthDayWithOrdinalAndTime', () => {
  const eveningEstGameDate = new Date('2025-06-11T00:30:00Z');

  it('combines the ordinal date and time in the account timezone', () => {
    expect(DateUtils.formatMonthDayWithOrdinalAndTime(eveningEstGameDate, 'America/New_York')).toBe(
      'June 10th at 8:30 PM',
    );
  });

  it('combines the ordinal date and time in UTC', () => {
    expect(DateUtils.formatMonthDayWithOrdinalAndTime(eveningEstGameDate, 'UTC')).toBe(
      'June 11th at 12:30 AM',
    );
  });

  it('returns null for missing dates', () => {
    expect(DateUtils.formatMonthDayWithOrdinalAndTime(null, 'UTC')).toBeNull();
  });
});
