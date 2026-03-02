import { describe, expect, it } from 'vitest';
import { getGameStatusText, getGameStatusShortText, getGameTypeText } from '../gameUtils';
import { GameStatus } from '../../types/schedule';

describe('getGameStatusText', () => {
  it('maps all known statuses', () => {
    expect(getGameStatusText(GameStatus.Scheduled)).toBe('Incomplete');
    expect(getGameStatusText(GameStatus.Completed)).toBe('Final');
    expect(getGameStatusText(GameStatus.Rainout)).toBe('Rainout');
    expect(getGameStatusText(GameStatus.Postponed)).toBe('Postponed');
    expect(getGameStatusText(GameStatus.Forfeit)).toBe('Forfeit');
    expect(getGameStatusText(GameStatus.DidNotReport)).toBe('Did Not Report');
  });

  it('returns Unknown for unrecognized status', () => {
    expect(getGameStatusText(99)).toBe('Unknown');
  });
});

describe('getGameStatusShortText', () => {
  it('maps all known statuses to abbreviations', () => {
    expect(getGameStatusShortText(GameStatus.Scheduled)).toBe('');
    expect(getGameStatusShortText(GameStatus.Completed)).toBe('F');
    expect(getGameStatusShortText(GameStatus.Rainout)).toBe('R');
    expect(getGameStatusShortText(GameStatus.Postponed)).toBe('PPD');
    expect(getGameStatusShortText(GameStatus.Forfeit)).toBe('FFT');
    expect(getGameStatusShortText(GameStatus.DidNotReport)).toBe('DNR');
  });

  it('returns empty string for unrecognized status', () => {
    expect(getGameStatusShortText(99)).toBe('');
  });
});

describe('getGameTypeText', () => {
  it('maps numeric game types', () => {
    expect(getGameTypeText(0)).toBe('Regular Season');
    expect(getGameTypeText(1)).toBe('Playoff');
    expect(getGameTypeText(2)).toBe('Championship');
  });

  it('maps string game types', () => {
    expect(getGameTypeText('0')).toBe('Regular Season');
    expect(getGameTypeText('1')).toBe('Playoff');
  });

  it('returns Unknown for unrecognized type', () => {
    expect(getGameTypeText(99)).toBe('Unknown');
  });
});
