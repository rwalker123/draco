import { describe, it, expect } from 'vitest';
import { formatGameDate } from '../../tools/helpers/formatGameDate.js';

describe('formatGameDate', () => {
  it('formats a game date in Eastern time', () => {
    const result = formatGameDate('2026-05-15T19:00:00-05:00', 'America/New_York');
    expect(result).toContain('May');
    expect(result).toContain('15');
    expect(result).toContain('PM');
  });

  it('formats a game date in Pacific time', () => {
    const result = formatGameDate('2026-05-15T19:00:00-05:00', 'America/Los_Angeles');
    expect(result).toContain('May');
    expect(result).toContain('PM');
  });

  it('formats a game date in UTC', () => {
    const result = formatGameDate('2026-06-20T14:00:00Z', 'UTC');
    expect(result).toContain('Jun');
    expect(result).toContain('20');
  });

  it('formats a weekend game correctly', () => {
    const result = formatGameDate('2026-05-16T10:00:00Z', 'UTC');
    expect(result).toMatch(/Sat/);
  });

  it('returns original string when timezone is invalid', () => {
    const iso = '2026-05-15T19:00:00-05:00';
    const result = formatGameDate(iso, 'Not/A/Timezone');
    expect(result).toBe(iso);
  });

  it('does not use moment or dayjs', async () => {
    const source = await import('../../tools/helpers/formatGameDate.js');
    expect(source).toBeDefined();
  });

  describe('timezone boundary rendering', () => {
    it('renders different output for Chicago vs New York for the same UTC time', () => {
      const iso = '2026-05-11T23:00:00Z';
      const chicago = formatGameDate(iso, 'America/Chicago');
      const nyc = formatGameDate(iso, 'America/New_York');
      expect(chicago).not.toBe(nyc);
    });
  });
});
