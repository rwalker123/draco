import { beforeEach, describe, expect, it } from 'vitest';
import type { SchedulerSolveResult } from '@draco/shared-schemas';
import {
  clearPersistedProposal,
  loadPersistedProposal,
  savePersistedProposal,
  type PersistedSchedulerProposal,
} from '../schedulerProposalStorage';

const buildResult = (): SchedulerSolveResult => ({
  runId: 'sched_account_1_abcdef',
  status: 'completed',
  metrics: { totalGames: 2, scheduledGames: 2, unscheduledGames: 0, objectiveValue: 2 },
  assignments: [
    {
      gameId: 'gen-1-10-11-0',
      fieldId: '44',
      startTime: '2026-04-05T09:00:00.000Z',
      endTime: '2026-04-05T10:15:00.000Z',
      umpireIds: ['7'],
    },
    {
      gameId: 'gen-1-10-12-0',
      fieldId: '44',
      startTime: '2026-04-06T09:00:00.000Z',
      endTime: '2026-04-06T10:15:00.000Z',
      umpireIds: [],
    },
  ],
  unscheduled: [],
});

const buildPayload = (): PersistedSchedulerProposal => ({
  proposal: buildResult(),
  proposalFromGenerated: true,
  generatedMatchups: [
    {
      id: 'gen-1-10-11-0',
      leagueSeasonId: '5',
      homeTeamSeasonId: '10',
      visitorTeamSeasonId: '11',
    },
  ],
  selectedGameIds: ['gen-1-10-11-0'],
});

describe('schedulerProposalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('round-trips a saved proposal for the same account and season', () => {
    const payload = buildPayload();
    savePersistedProposal('1', '2026', payload);

    const loaded = loadPersistedProposal('1', '2026');
    expect(loaded).toEqual(payload);
    expect(loaded?.selectedGameIds).toEqual(['gen-1-10-11-0']);
    expect(loaded?.generatedMatchups?.[0]?.homeTeamSeasonId).toBe('10');
  });

  it('returns null when nothing is stored', () => {
    expect(loadPersistedProposal('1', '2026')).toBeNull();
  });

  it('isolates proposals by account and season key', () => {
    savePersistedProposal('1', '2026', buildPayload());

    expect(loadPersistedProposal('1', '2025')).toBeNull();
    expect(loadPersistedProposal('2', '2026')).toBeNull();
    expect(loadPersistedProposal('1', '2026')).not.toBeNull();
  });

  it('clears a stored proposal', () => {
    savePersistedProposal('1', '2026', buildPayload());
    expect(loadPersistedProposal('1', '2026')).not.toBeNull();

    clearPersistedProposal('1', '2026');
    expect(loadPersistedProposal('1', '2026')).toBeNull();
  });

  it('returns null for corrupt JSON', () => {
    window.localStorage.setItem('scheduler:proposal:1:2026', '{not valid json');
    expect(loadPersistedProposal('1', '2026')).toBeNull();
  });

  it('rejects a blob missing a valid proposal shape', () => {
    window.localStorage.setItem(
      'scheduler:proposal:1:2026',
      JSON.stringify({ proposalFromGenerated: false, selectedGameIds: [] }),
    );
    expect(loadPersistedProposal('1', '2026')).toBeNull();
  });

  it('normalizes missing optional fields on load', () => {
    window.localStorage.setItem(
      'scheduler:proposal:1:2026',
      JSON.stringify({ proposal: buildResult() }),
    );

    const loaded = loadPersistedProposal('1', '2026');
    expect(loaded?.proposalFromGenerated).toBe(false);
    expect(loaded?.generatedMatchups).toBeNull();
    expect(loaded?.selectedGameIds).toEqual([]);
  });
});
