import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useScorecardStore } from '../scorecardStore';
import type { ScorecardInitializer, ScoreEventInput } from '../../types/scoring';

vi.mock('../../storage/scorecardStorage', () => ({
  loadScorecardSnapshot: vi.fn(),
  saveScorecardSnapshot: vi.fn(),
}));

const storage = await import('../../storage/scorecardStorage');
const loadSnapshotMock = storage.loadScorecardSnapshot as ReturnType<typeof vi.fn>;
const saveSnapshotMock = storage.saveScorecardSnapshot as ReturnType<typeof vi.fn>;

const initializer: ScorecardInitializer = {
  id: 'game-1',
  homeTeam: { id: 'home', name: 'Home Club' } as unknown as ScorecardInitializer['homeTeam'],
  visitorTeam: { id: 'away', name: 'Away Club' } as unknown as ScorecardInitializer['visitorTeam'],
  field: { id: 'field-1', name: 'Heritage Field' } as unknown as ScorecardInitializer['field'],
  startsAt: new Date().toISOString()
};

describe('scorecardStore', () => {
  beforeEach(() => {
    useScorecardStore.setState({
      hydrated: false,
      status: 'idle',
      error: null,
      activeGameId: null,
      games: {},
      hydrate: useScorecardStore.getState().hydrate,
      setActiveGame: useScorecardStore.getState().setActiveGame,
      recordEvent: useScorecardStore.getState().recordEvent,
      undo: useScorecardStore.getState().undo,
      redo: useScorecardStore.getState().redo,
      editEvent: useScorecardStore.getState().editEvent,
      deleteEvent: useScorecardStore.getState().deleteEvent,
      clearGame: useScorecardStore.getState().clearGame
    });
    vi.clearAllMocks();
  });

  it('records at-bat events and updates inning state', async () => {
    loadSnapshotMock.mockResolvedValue(null);
    saveSnapshotMock.mockResolvedValue(undefined);

    await useScorecardStore.getState().setActiveGame(initializer);

    const batter = { id: 'b1', name: 'Alex' };
    const single: ScoreEventInput = {
      type: 'at_bat',
      batter,
      result: 'single',
      advances: [{ runner: batter, start: 'batter', end: 'first' }],
      pitches: 3
    };

    await useScorecardStore.getState().recordEvent(initializer.id, single, {
      userName: 'Scorekeeper',
      deviceId: 'device-1'
    });

    let game = useScorecardStore.getState().games[initializer.id];
    expect(game.state.bases.first?.name).toBe('Alex');
    expect(game.state.score.away).toBe(0);
    expect(game.derived.batting.hits).toBe(1);

    const runnerOnFirst = game.state.bases.first!;
    const homer: ScoreEventInput = {
      type: 'at_bat',
      batter: { id: 'b2', name: 'River' },
      result: 'home_run',
      advances: [
        { runner: { id: 'b2', name: 'River' }, start: 'batter', end: 'home' },
        { runner: runnerOnFirst, start: 'first', end: 'home' }
      ],
      pitches: 1
    };

    await useScorecardStore.getState().recordEvent(initializer.id, homer, {
      userName: 'Scorekeeper',
      deviceId: 'device-1'
    });

    game = useScorecardStore.getState().games[initializer.id];
    expect(game.state.score.away).toBe(2);
    expect(game.events).toHaveLength(2);
    expect(game.derived.batting.runs).toBe(2);
    expect(game.state.bases.first).toBeNull();
  });

  it('supports undo and redo stacks', async () => {
    loadSnapshotMock.mockResolvedValue(null);
    saveSnapshotMock.mockResolvedValue(undefined);

    await useScorecardStore.getState().setActiveGame(initializer);

    const batter = { id: 'b1', name: 'Alex' };
    const single: ScoreEventInput = {
      type: 'at_bat',
      batter,
      result: 'single',
      advances: [{ runner: batter, start: 'batter', end: 'first' }],
      pitches: 3
    };

    await useScorecardStore.getState().recordEvent(initializer.id, single, {
      userName: 'Scorekeeper',
      deviceId: 'device-1'
    });

    await useScorecardStore.getState().undo(initializer.id);
    let game = useScorecardStore.getState().games[initializer.id];
    expect(game.events).toHaveLength(0);
    expect(game.redoStack).toHaveLength(1);

    await useScorecardStore.getState().redo(initializer.id);
    game = useScorecardStore.getState().games[initializer.id];
    expect(game.events).toHaveLength(1);
    expect(game.state.bases.first?.name).toBe('Alex');
  });

  it('recomputes downstream state when editing prior events', async () => {
    loadSnapshotMock.mockResolvedValue(null);
    saveSnapshotMock.mockResolvedValue(undefined);

    await useScorecardStore.getState().setActiveGame(initializer);

    const batter = { id: 'b1', name: 'Alex' };
    const single: ScoreEventInput = {
      type: 'at_bat',
      batter,
      result: 'single',
      advances: [{ runner: batter, start: 'batter', end: 'first' }],
      pitches: 2
    };

    await useScorecardStore.getState().recordEvent(initializer.id, single, {
      userName: 'Scorekeeper',
      deviceId: 'device-1'
    });

    const strikeout: ScoreEventInput = {
      type: 'at_bat',
      batter,
      result: 'strikeout_swinging',
      advances: [],
      pitches: 4
    };

    const game = useScorecardStore.getState().games[initializer.id];
    const firstEventId = game.events[0].id;

    await useScorecardStore.getState().editEvent(initializer.id, firstEventId, strikeout);

    const updated = useScorecardStore.getState().games[initializer.id];
    expect(updated.events[0].input.result).toBe('strikeout_swinging');
    expect(updated.state.outs).toBe(1);
    expect(updated.state.bases.first).toBeNull();
    expect(updated.derived.batting.hits).toBe(0);
  });

  it('hydrates games from persisted snapshot', async () => {
    const storedEvent = {
      id: 'event-1',
      sequence: 1,
      createdAt: new Date().toISOString(),
      createdBy: 'Scorekeeper',
      deviceId: 'device-1',
      input: {
        type: 'at_bat',
        batter: { id: 'b1', name: 'Alex' },
        result: 'walk',
        advances: [{ runner: { id: 'b1', name: 'Alex' }, start: 'batter', end: 'first' }]
      } satisfies ScoreEventInput
    };

    loadSnapshotMock.mockResolvedValue({
      [initializer.id]: {
        metadata: {
          gameId: initializer.id,
          homeTeam: 'Home Club',
          awayTeam: 'Away Club',
          field: 'Heritage Field',
          scheduledStart: initializer.startsAt
        },
        events: [storedEvent],
        lastUpdated: Date.now()
      }
    });

    saveSnapshotMock.mockResolvedValue(undefined);

    await useScorecardStore.getState().hydrate();

    const game = useScorecardStore.getState().games[initializer.id];
    expect(game).toBeDefined();
    expect(game.events).toHaveLength(1);
    expect(game.state.bases.first?.name).toBe('Alex');
    expect(useScorecardStore.getState().hydrated).toBe(true);
  });
});
