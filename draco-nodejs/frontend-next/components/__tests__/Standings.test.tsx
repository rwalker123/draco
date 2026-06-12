import { describe, expect, it } from 'vitest';
import { formatExpectedRecord, formatRunDifferential } from '../Standings';

describe('formatRunDifferential', () => {
  it('prefixes positive differentials with a plus sign', () => {
    expect(formatRunDifferential(40, 25)).toBe('+15');
  });

  it('renders negative differentials with a minus sign', () => {
    expect(formatRunDifferential(18, 33)).toBe('-15');
  });

  it('renders an even differential as 0', () => {
    expect(formatRunDifferential(30, 30)).toBe('0');
  });
});

describe('formatExpectedRecord', () => {
  it('splits games evenly when runs scored equals runs against', () => {
    // ExpWin% = 1/2, so 10 games -> 5-5.
    expect(formatExpectedRecord(50, 50, 10)).toBe('5-5');
  });

  it('is win-heavy when runs scored greatly exceeds runs against', () => {
    // 100^2 / (100^2 + 50^2) = 0.8 -> round(0.8 * 10) = 8 wins.
    expect(formatExpectedRecord(100, 50, 10)).toBe('8-2');
  });

  it('is loss-heavy when runs against greatly exceeds runs scored', () => {
    expect(formatExpectedRecord(50, 100, 10)).toBe('2-8');
  });

  it('returns a dash when no games have been played', () => {
    expect(formatExpectedRecord(0, 0, 0)).toBe('-');
  });

  it('returns a dash when no runs have been recorded', () => {
    expect(formatExpectedRecord(0, 0, 8)).toBe('-');
  });
});
