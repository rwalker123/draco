import { describe, expect, it } from 'vitest';
import {
  describeScoreEvent,
  formatAdvances,
  formatRetrosheetNotation,
  formatRunnerAdvance
} from '../retrosheetParser';
import type { RunnerAdvance, ScoreEventInput } from '../../types/scoring';

describe('retrosheetParser', () => {
  it('formats runner advances into retrosheet notation', () => {
    const advances: RunnerAdvance[] = [
      {
        runner: { id: 'runner-1', name: 'Batter' },
        start: 'batter',
        end: 'first'
      },
      {
        runner: { id: 'runner-2', name: 'Lead Runner' },
        start: 'second',
        end: 'home'
      }
    ];

    expect(formatRunnerAdvance(advances[0])).toBe('B-1');
    expect(formatRunnerAdvance(advances[1])).toBe('2-H');
    expect(formatAdvances(advances)).toBe('B-1;2-H');
  });

  it('produces play notation for singles with advances', () => {
    const input: ScoreEventInput = {
      type: 'at_bat',
      batter: { id: 'batter-1', name: 'Alex' },
      result: 'single',
      advances: [
        { runner: { id: 'batter-1', name: 'Alex' }, start: 'batter', end: 'first' },
        { runner: { id: 'runner-1', name: 'Sam' }, start: 'third', end: 'home' }
      ],
      pitches: 4
    };

    expect(formatRetrosheetNotation(input)).toBe('S;B-1;3-H');
  });

  it('renders runner events such as stolen bases and caught stealing', () => {
    const steal: ScoreEventInput = {
      type: 'runner',
      action: 'stolen_base',
      runner: { id: 'runner-1', name: 'Taylor' },
      from: 'first',
      to: 'second'
    };

    const caught: ScoreEventInput = {
      type: 'runner',
      action: 'caught_stealing',
      runner: { id: 'runner-2', name: 'Jordan' },
      from: 'second',
      to: 'out'
    };

    expect(formatRetrosheetNotation(steal)).toBe('SB12');
    expect(formatRetrosheetNotation(caught)).toBe('CS2X');
  });

  it('generates substitution codes with position and outgoing players', () => {
    const substitution: ScoreEventInput = {
      type: 'substitution',
      role: 'runner',
      incoming: { id: 'runner-3', name: 'Jamie' },
      outgoing: { id: 'runner-1', name: 'Taylor' },
      position: 'PR'
    };

    expect(formatRetrosheetNotation(substitution)).toBe('SUBR:Jamie/Taylor-PR');
    expect(describeScoreEvent(substitution)).toBe('Substitution – Jamie');
  });
});
