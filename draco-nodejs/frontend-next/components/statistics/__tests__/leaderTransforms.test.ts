import { describe, it, expect } from 'vitest';
import type { LeaderRowType } from '@draco/shared-schemas';
import { getLeaderForCard, processLeadersForTable } from '../leaderTransforms';

const makePlayerRow = (overrides: Partial<LeaderRowType> = {}): LeaderRowType => ({
  playerId: '1',
  playerName: 'Test Player',
  teams: ['Test Team'],
  teamName: 'Test Team',
  statValue: 1.0,
  category: 'avg',
  rank: 1,
  ...overrides,
});

const makeTieIndicator = (overrides: Partial<LeaderRowType> = {}): LeaderRowType => ({
  playerId: '0',
  playerName: '',
  teamName: '',
  statValue: 1.0,
  category: 'avg',
  rank: 1,
  isTie: true,
  tieCount: 8,
  ...overrides,
});

describe('getLeaderForCard', () => {
  it('returns null when no rank-1 entries exist', () => {
    expect(getLeaderForCard([])).toBeNull();
    expect(getLeaderForCard([makePlayerRow({ rank: 2 })])).toBeNull();
  });

  it('returns the single rank-1 player when only one leader exists', () => {
    const leader = makePlayerRow({ playerName: 'Solo Leader' });
    expect(getLeaderForCard([leader])).toEqual(leader);
  });

  it('synthesizes a tie card when multiple individual players share rank 1', () => {
    const leaders = [
      makePlayerRow({ playerId: '1', playerName: 'P1', statValue: 3, category: 'rbi' }),
      makePlayerRow({ playerId: '2', playerName: 'P2', statValue: 3, category: 'rbi' }),
      makePlayerRow({ playerId: '3', playerName: 'P3', statValue: 3, category: 'rbi' }),
    ];
    const card = getLeaderForCard(leaders);
    expect(card).toEqual({
      playerId: 'tie-entry',
      playerName: '3 tied',
      teams: [],
      teamName: '',
      statValue: 3,
      category: 'rbi',
      rank: 1,
      isTie: true,
      tieCount: 3,
    });
  });

  it('promotes a backend-supplied rank-1 isTie indicator to the leader card', () => {
    const indicator = makeTieIndicator({ tieCount: 8, statValue: 1.0, category: 'avg' });
    expect(getLeaderForCard([indicator])).toEqual(indicator);
  });

  it('promotes a 50-way tie indicator to the leader card', () => {
    const indicator = makeTieIndicator({ tieCount: 50, statValue: 0, category: 'hr' });
    const card = getLeaderForCard([indicator]);
    expect(card?.isTie).toBe(true);
    expect(card?.tieCount).toBe(50);
    expect(card?.statValue).toBe(0);
  });
});

describe('processLeadersForTable', () => {
  it('returns leaders unchanged when no leader card is set', () => {
    const leaders = [makePlayerRow({ rank: 2 })];
    expect(processLeadersForTable(leaders, null)).toEqual(leaders);
  });

  it('removes the rank-1 player row when a single-player card is shown', () => {
    const leaders = [
      makePlayerRow({ playerId: '1', rank: 1 }),
      makePlayerRow({ playerId: '2', rank: 2 }),
    ];
    const card = leaders[0];
    const result = processLeadersForTable(leaders, card);
    expect(result).toHaveLength(1);
    expect(result[0].playerId).toBe('2');
  });

  it('keeps individual rank-1 rows when the tie card is synthesized from real players', () => {
    const leaders = [
      makePlayerRow({ playerId: '1', rank: 1, statValue: 3, category: 'rbi' }),
      makePlayerRow({ playerId: '2', rank: 1, statValue: 3, category: 'rbi' }),
      makePlayerRow({ playerId: '3', rank: 1, statValue: 3, category: 'rbi' }),
      { ...makeTieIndicator({ rank: 4, tieCount: 4, statValue: 2, category: 'rbi' }) },
    ];
    const card = getLeaderForCard(leaders);
    const result = processLeadersForTable(leaders, card);
    expect(result.map((row) => row.playerId)).toEqual(['1', '2', '3', '0']);
    expect(result[3].playerName).toBe('4 tied');
  });

  it('hides the rank-1 tie indicator row from the table when promoted to the card', () => {
    const indicator = makeTieIndicator({ tieCount: 8 });
    const leaders = [indicator];
    const card = getLeaderForCard(leaders);
    const result = processLeadersForTable(leaders, card);
    expect(result).toEqual([]);
  });

  it('reformats lower-ranked isTie rows with a "N tied" label', () => {
    const leaders = [
      makePlayerRow({ playerId: '1', rank: 1 }),
      makeTieIndicator({ rank: 3, tieCount: 4, statValue: 2 }),
    ];
    const result = processLeadersForTable(leaders, leaders[0]);
    expect(result).toHaveLength(1);
    expect(result[0].playerName).toBe('4 tied');
  });
});
