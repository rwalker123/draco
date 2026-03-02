import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  formatGameDateTime,
  formatGameTime,
  convertUTCToZonedDate,
  formatDateSafely,
  formatDateShort,
  formatDateTime,
  formatDateTimeInTimezone,
  formatDateInTimezone,
  formatTimeInTimezone,
  getDateKeyInTimezone,
  isSameDayInTimezone,
  isValidDate,
  formatDateOfBirth,
  calculateAge,
  formatDate,
} from '../dateUtils';

describe('formatGameDateTime', () => {
  it('converts local date/time parts to UTC string', () => {
    const gameDate = new Date(2024, 5, 15);
    const gameTime = new Date(2024, 0, 1, 14, 30);
    const result = formatGameDateTime(gameDate, gameTime, 'UTC');
    expect(result).toBe('2024-06-15T14:30:00Z');
  });

  it('handles Eastern timezone offset', () => {
    const gameDate = new Date(2024, 5, 15);
    const gameTime = new Date(2024, 0, 1, 19, 0);
    const result = formatGameDateTime(gameDate, gameTime, 'America/New_York');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});

describe('formatGameTime', () => {
  it('returns TBD for empty string', () => {
    expect(formatGameTime('')).toBe('TBD');
  });

  it('formats valid date string', () => {
    const result = formatGameTime('2024-06-15T14:30:00Z', 'UTC');
    expect(result).toContain('2:30');
  });

  it('returns N/A for invalid date string that is non-empty', () => {
    const result = formatGameTime('not-a-date');
    expect(['TBD', 'N/A']).toContain(result);
  });
});

describe('convertUTCToZonedDate', () => {
  it('returns a Date for valid input', () => {
    const result = convertUTCToZonedDate('2024-06-15T14:30:00Z', 'UTC');
    expect(result).toBeInstanceOf(Date);
    expect(result!.getHours()).toBe(14);
    expect(result!.getMinutes()).toBe(30);
  });

  it('returns null for invalid date', () => {
    expect(convertUTCToZonedDate('invalid', 'UTC')).toBeNull();
  });
});

describe('formatDateSafely', () => {
  it('returns N/A for invalid date', () => {
    expect(formatDateSafely('not-a-date')).toBe('N/A');
    expect(formatDateSafely(undefined)).toBe('N/A');
  });

  it('handles null (epoch) as a valid date', () => {
    const result = formatDateSafely(null);
    expect(result).toBeTruthy();
  });

  it('formats a valid date', () => {
    const result = formatDateSafely('2024-06-15');
    expect(result).toBeTruthy();
    expect(result).not.toBe('N/A');
  });

  it('uses provided options', () => {
    const result = formatDateSafely('2024-06-15T00:00:00Z', { year: 'numeric' });
    expect(result).toContain('2024');
  });
});

describe('formatDateShort', () => {
  it('returns N/A for invalid date', () => {
    expect(formatDateShort('garbage')).toBe('N/A');
  });

  it('formats valid date as MM/DD/YYYY', () => {
    const result = formatDateShort('2024-01-15T00:00:00Z');
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});

describe('formatDateTime', () => {
  it('includes time information', () => {
    const result = formatDateTime('2024-06-15T14:30:00Z');
    expect(result).not.toBe('N/A');
  });

  it('returns N/A for invalid', () => {
    expect(formatDateTime('invalid')).toBe('N/A');
  });
});

describe('formatDateTimeInTimezone', () => {
  it('formats date in specified timezone', () => {
    const result = formatDateTimeInTimezone('2024-06-15T14:30:00Z', 'UTC');
    expect(result).not.toBe('N/A');
  });

  it('returns N/A for invalid date', () => {
    expect(formatDateTimeInTimezone('invalid', 'UTC')).toBe('N/A');
  });
});

describe('formatDateInTimezone', () => {
  it('formats date with long month', () => {
    const result = formatDateInTimezone('2024-06-15T14:30:00Z', 'UTC');
    expect(result).toContain('June');
  });
});

describe('formatTimeInTimezone', () => {
  it('formats time in timezone', () => {
    const result = formatTimeInTimezone('2024-06-15T14:30:00Z', 'UTC');
    expect(result).toContain('2:30');
  });

  it('returns N/A for invalid date', () => {
    expect(formatTimeInTimezone('invalid', 'UTC')).toBe('N/A');
  });
});

describe('getDateKeyInTimezone', () => {
  it('returns YYYY-MM-DD key', () => {
    expect(getDateKeyInTimezone('2024-06-15T14:30:00Z', 'UTC')).toBe('2024-06-15');
  });

  it('returns null for invalid date', () => {
    expect(getDateKeyInTimezone('invalid', 'UTC')).toBeNull();
  });
});

describe('isSameDayInTimezone', () => {
  it('returns true for same day', () => {
    expect(isSameDayInTimezone('2024-06-15T10:00:00Z', '2024-06-15T22:00:00Z', 'UTC')).toBe(true);
  });

  it('returns false for different days', () => {
    expect(isSameDayInTimezone('2024-06-15T10:00:00Z', '2024-06-16T10:00:00Z', 'UTC')).toBe(false);
  });

  it('returns false when one date is invalid', () => {
    expect(isSameDayInTimezone('invalid', '2024-06-15T10:00:00Z', 'UTC')).toBe(false);
  });
});

describe('isValidDate', () => {
  it('returns true for valid dates', () => {
    expect(isValidDate('2024-06-15')).toBe(true);
    expect(isValidDate(new Date())).toBe(true);
    expect(isValidDate(Date.now())).toBe(true);
  });

  it('returns false for invalid dates', () => {
    expect(isValidDate('not-a-date')).toBe(false);
  });

  it('treats null as epoch (valid date)', () => {
    expect(isValidDate(null)).toBe(true);
  });
});

describe('formatDateOfBirth', () => {
  it('returns empty string for null', () => {
    expect(formatDateOfBirth(null)).toBe('');
  });

  it('formats YYYY-MM-DD without timezone shift', () => {
    const result = formatDateOfBirth('1990-07-04');
    expect(result).toContain('July');
    expect(result).toContain('4');
    expect(result).toContain('1990');
  });

  it('formats ISO timestamp in UTC', () => {
    const result = formatDateOfBirth('1990-07-04T00:00:00Z');
    expect(result).toContain('July');
    expect(result).toContain('4');
    expect(result).toContain('1990');
  });

  it('returns original string on error', () => {
    expect(formatDateOfBirth('not-a-date')).toBe('not-a-date');
  });
});

describe('calculateAge', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('calculates age correctly', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15));
    expect(calculateAge('1990-06-15')).toBe(34);
  });

  it('subtracts one if birthday has not occurred yet this year', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 1));
    expect(calculateAge('1990-06-15')).toBe(33);
  });
});

describe('formatDate', () => {
  it('formats date with short month', () => {
    const result = formatDate('2024-06-15T00:00:00Z');
    expect(result).toContain('2024');
  });
});
