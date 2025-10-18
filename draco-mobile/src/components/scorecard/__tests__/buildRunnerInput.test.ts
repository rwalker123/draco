import { describe, expect, it } from 'vitest';
import { buildRunnerInput } from '../runnerUtils';
import type { ScorecardGame, RunnerState } from '../../../types/scoring';

const createEmptyGame = (): ScorecardGame => ({
  metadata: {
    gameId: 'game-1',
    homeTeam: 'Home',
    awayTeam: 'Away',
    field: null,
    scheduledStart: undefined
  },
  state: {
    inning: 1,
    half: 'top',
    outs: 0,
    bases: {
      first: null,
      second: null,
      third: null
    },
    score: {
      home: 0,
      away: 0
    }
  },
  events: [],
  redoStack: [],
  derived: {
    pitching: {
      totalPitches: 0
    },
    batting: {
      atBats: 0,
      runs: 0,
      hits: 0,
      rbi: 0,
      walks: 0,
      strikeouts: 0
    }
  }
});

describe('buildRunnerInput', () => {
  it('uses stored runner details when runner is no longer on base', () => {
    const game = createEmptyGame();
    const runner: RunnerState = { id: 'runner-1', name: 'Speedy' };

    const runnerState: Parameters<typeof buildRunnerInput>[1] = {
      runnerId: runner.id,
      runner,
      base: 'second',
      action: 'stolen_base',
      destination: 'third',
      notes: 'Going for third'
    };

    const result = buildRunnerInput(game, runnerState);

    expect(result).toEqual({
      type: 'runner',
      runner,
      from: 'second',
      to: 'third',
      action: 'stolen_base',
      notes: 'Going for third'
    });
  });
});
