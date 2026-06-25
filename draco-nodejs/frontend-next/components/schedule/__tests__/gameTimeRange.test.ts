import { describe, it, expect } from 'vitest';
import { isGameTimeWithinAllowedRange } from '../gameTimeRange';

const at = (hour: number, minute = 0): Date => new Date(2025, 5, 10, hour, minute, 0, 0);

describe('isGameTimeWithinAllowedRange', () => {
  it('rejects times before 9:00 AM', () => {
    expect(isGameTimeWithinAllowedRange(at(8, 59))).toBe(false);
    expect(isGameTimeWithinAllowedRange(at(0))).toBe(false);
  });

  it('accepts 9:00 AM (inclusive lower bound)', () => {
    expect(isGameTimeWithinAllowedRange(at(9, 0))).toBe(true);
  });

  it('accepts times within the window', () => {
    expect(isGameTimeWithinAllowedRange(at(12, 30))).toBe(true);
    expect(isGameTimeWithinAllowedRange(at(20, 59))).toBe(true);
  });

  it('accepts 9:00 PM exactly (inclusive upper bound)', () => {
    expect(isGameTimeWithinAllowedRange(at(21, 0))).toBe(true);
  });

  it('rejects times after 9:00 PM', () => {
    expect(isGameTimeWithinAllowedRange(at(21, 1))).toBe(false);
    expect(isGameTimeWithinAllowedRange(at(22, 0))).toBe(false);
    expect(isGameTimeWithinAllowedRange(at(23, 30))).toBe(false);
  });
});
