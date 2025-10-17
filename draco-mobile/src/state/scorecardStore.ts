import { createStore } from './createStore';
import {
  describeScoreEvent,
  formatRetrosheetNotation
} from '../utils/retrosheetParser';
import {
  type AtBatResult,
  type BaseName,
  type DerivedStats,
  type GameScoreState,
  type RunnerAdvance,
  type RunnerEventInput,
  type ScoreEvent,
  type ScoreEventInput,
  type ScorecardGame,
  type ScorecardInitializer,
  type ScorecardMetadata,
  type SubstitutionEventInput,
  type PlayEventInput,
  type RunnerState
} from '../types/scoring';
import { loadScorecardSnapshot, saveScorecardSnapshot } from '../storage/scorecardStorage';
import { generateId } from '../utils/id';

const EMPTY_BASES = (): GameScoreState['bases'] => ({
  first: null,
  second: null,
  third: null
});

const INITIAL_STATE = (): GameScoreState => ({
  inning: 1,
  half: 'top',
  outs: 0,
  bases: EMPTY_BASES(),
  score: {
    home: 0,
    away: 0
  }
});

const INITIAL_DERIVED = (): DerivedStats => ({
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
});

type ApplyResult = {
  state: GameScoreState;
  runsScored: number;
  hitsRecorded: number;
  rbi: number;
  atBat: boolean;
  walk: boolean;
  strikeout: boolean;
  pitches: number;
};

type EventContext = {
  userName: string;
  deviceId: string;
};

type ScorecardStatus = 'idle' | 'loading' | 'error';

type InternalGame = ScorecardGame & {
  events: ScoreEvent[];
};

type ScorecardState = {
  hydrated: boolean;
  status: ScorecardStatus;
  error: string | null;
  activeGameId: string | null;
  games: Record<string, InternalGame>;
  hydrate: () => Promise<void>;
  setActiveGame: (initializer: ScorecardInitializer) => Promise<void>;
  recordEvent: (gameId: string, input: ScoreEventInput, context: EventContext) => Promise<ScoreEvent>;
  undo: (gameId: string) => Promise<void>;
  redo: (gameId: string) => Promise<void>;
  editEvent: (gameId: string, eventId: string, input: ScoreEventInput) => Promise<void>;
  deleteEvent: (gameId: string, eventId: string) => Promise<void>;
  clearGame: (gameId: string) => Promise<void>;
};

const isHit = (result: AtBatResult): boolean =>
  result === 'single' || result === 'double' || result === 'triple' || result === 'home_run';

const countsAsAtBat = (result: AtBatResult): boolean =>
  !['walk', 'hit_by_pitch', 'sacrifice_fly'].includes(result);

const resultIsOut = (result: AtBatResult): boolean =>
  ['strikeout_swinging', 'strikeout_looking', 'ground_out', 'fly_out', 'sacrifice_fly'].includes(result);

const resultIsWalk = (result: AtBatResult): boolean => result === 'walk';

const resultIsStrikeout = (result: AtBatResult): boolean =>
  result === 'strikeout_swinging' || result === 'strikeout_looking';

const cloneBases = (bases: GameScoreState['bases']): GameScoreState['bases'] => ({
  first: bases.first ? { ...bases.first } : null,
  second: bases.second ? { ...bases.second } : null,
  third: bases.third ? { ...bases.third } : null
});

const getBattingTeam = (state: GameScoreState): keyof GameScoreState['score'] =>
  state.half === 'top' ? 'away' : 'home';

const validateRunnerPresence = (bases: GameScoreState['bases'], advance: RunnerAdvance): void => {
  if (advance.start === 'batter') {
    return;
  }
  const runner = bases[advance.start];
  if (!runner) {
    throw new Error(`No runner on ${advance.start}`);
  }
  if (runner.id !== advance.runner.id) {
    throw new Error('Runner mismatch for base advance');
  }
};

const ensureTargetAvailability = (
  targets: Partial<Record<BaseName, RunnerState>>,
  destination: BaseName
): void => {
  if (targets[destination]) {
    throw new Error('Multiple runners cannot occupy the same base');
  }
};

const applyAdvances = (
  state: GameScoreState,
  input: PlayEventInput
): {
  nextState: GameScoreState;
  runsScored: number;
  outsRecorded: number;
  rbi: number;
} => {
  const bases = cloneBases(state.bases);
  const targets: Partial<Record<BaseName, RunnerState>> = {};
  let outsRecorded = resultIsOut(input.result) ? 1 : 0;
  let runsScored = 0;
  let rbi = 0;

  input.advances.forEach((advance) => {
    validateRunnerPresence(bases, advance);
    if (advance.start !== 'batter') {
      bases[advance.start] = null;
    }

    if (advance.end === 'out') {
      outsRecorded += 1;
      return;
    }

    if (advance.end === 'home') {
      runsScored += 1;
      rbi += advance.rbis ?? 1;
      return;
    }

    ensureTargetAvailability(targets, advance.end);
    targets[advance.end] = advance.runner;
  });

  const updatedBases: GameScoreState['bases'] = {
    first: targets.first ?? bases.first ?? null,
    second: targets.second ?? bases.second ?? null,
    third: targets.third ?? bases.third ?? null
  };

  return {
    nextState: {
      ...state,
      bases: updatedBases,
      outs: state.outs + outsRecorded
    },
    runsScored,
    outsRecorded,
    rbi
  };
};

const resolveHalfInningTransition = (state: GameScoreState): GameScoreState => {
  if (state.outs < 3) {
    return state;
  }

  const wasBottom = state.half === 'bottom';
  return {
    inning: wasBottom ? state.inning + 1 : state.inning,
    half: wasBottom ? 'top' : 'bottom',
    outs: 0,
    bases: EMPTY_BASES(),
    score: state.score
  };
};

const applyAtBatEvent = (state: GameScoreState, input: PlayEventInput): ApplyResult => {
  const battingTeam = getBattingTeam(state);
  const { nextState, runsScored, rbi } = applyAdvances(state, input);

  const score = {
    ...nextState.score,
    [battingTeam]: nextState.score[battingTeam] + runsScored
  };

  const normalizedState = resolveHalfInningTransition({
    ...nextState,
    score
  });

  return {
    state: normalizedState,
    runsScored,
    hitsRecorded: isHit(input.result) ? 1 : 0,
    rbi,
    atBat: countsAsAtBat(input.result),
    walk: resultIsWalk(input.result),
    strikeout: resultIsStrikeout(input.result),
    pitches: input.pitches ?? 1
  };
};

const applyRunnerEvent = (state: GameScoreState, input: RunnerEventInput): ApplyResult => {
  const bases = cloneBases(state.bases);
  const runner = bases[input.from];
  if (!runner || runner.id !== input.runner.id) {
    throw new Error('Runner is not present on the specified base');
  }

  bases[input.from] = null;
  let runsScored = 0;
  let outsRecorded = 0;

  if (input.to === 'out') {
    outsRecorded = 1;
  } else if (input.to === 'home') {
    runsScored = 1;
  } else {
    const destination = bases[input.to];
    if (destination) {
      throw new Error('Destination base already occupied');
    }
    bases[input.to] = runner;
  }

  const battingTeam = getBattingTeam(state);
  const score = {
    ...state.score,
    [battingTeam]: state.score[battingTeam] + runsScored
  };

  const updatedState = resolveHalfInningTransition({
    ...state,
    bases,
    outs: state.outs + outsRecorded,
    score
  });

  return {
    state: updatedState,
    runsScored,
    hitsRecorded: 0,
    rbi: 0,
    atBat: false,
    walk: false,
    strikeout: false,
    pitches: 0
  };
};

const applySubstitutionEvent = (
  state: GameScoreState,
  input: SubstitutionEventInput
): ApplyResult => {
  const bases = cloneBases(state.bases);
  if (input.role === 'runner' && input.outgoing) {
    (['first', 'second', 'third'] as BaseName[]).forEach((base) => {
      const occupant = bases[base];
      if (occupant && occupant.id === input.outgoing?.id) {
        bases[base] = { ...input.incoming };
      }
    });
  }

  return {
    state: {
      ...state,
      bases
    },
    runsScored: 0,
    hitsRecorded: 0,
    rbi: 0,
    atBat: false,
    walk: false,
    strikeout: false,
    pitches: 0
  };
};

const applyScoreEventInput = (
  state: GameScoreState,
  input: ScoreEventInput
): ApplyResult => {
  switch (input.type) {
    case 'at_bat':
      return applyAtBatEvent(state, input);
    case 'runner':
      return applyRunnerEvent(state, input);
    case 'substitution':
      return applySubstitutionEvent(state, input);
    default: {
      input satisfies never;
      throw new Error('Unsupported event');
    }
  }
};

const accumulateDerived = (
  previous: DerivedStats,
  delta: ApplyResult
): DerivedStats => ({
  pitching: {
    totalPitches: previous.pitching.totalPitches + delta.pitches
  },
  batting: {
    atBats: previous.batting.atBats + (delta.atBat ? 1 : 0),
    runs: previous.batting.runs + delta.runsScored,
    hits: previous.batting.hits + delta.hitsRecorded,
    rbi: previous.batting.rbi + delta.rbi,
    walks: previous.batting.walks + (delta.walk ? 1 : 0),
    strikeouts: previous.batting.strikeouts + (delta.strikeout ? 1 : 0)
  }
});

const recomputeGame = (game: InternalGame): InternalGame => {
  let state = INITIAL_STATE();
  let derived = INITIAL_DERIVED();
  const recomputedEvents: ScoreEvent[] = [];

  const orderedEvents = [...game.events].sort((a, b) => a.sequence - b.sequence);

  orderedEvents.forEach((event) => {
    const delta = applyScoreEventInput(state, event.input);
    const nextState = delta.state;

    recomputedEvents.push({
      ...event,
      inning: state.inning,
      half: state.half,
      outsBefore: state.outs,
      outsAfter: nextState.outs,
      scoreAfter: nextState.score,
      basesAfter: nextState.bases,
      notation: formatRetrosheetNotation(event.input),
      summary: describeScoreEvent(event.input)
    });

    state = nextState;
    derived = accumulateDerived(derived, delta);
  });

  const recomputedRedo = game.redoStack.map((event) => ({
    ...event,
    notation: formatRetrosheetNotation(event.input),
    summary: describeScoreEvent(event.input)
  }));

  return {
    ...game,
    events: recomputedEvents,
    state,
    derived,
    redoStack: recomputedRedo
  };
};

const buildGame = (metadata: ScorecardMetadata, events: ScoreEvent[]): InternalGame => {
  return recomputeGame({
    metadata,
    events,
    redoStack: [],
    state: INITIAL_STATE(),
    derived: INITIAL_DERIVED()
  });
};

const persistGames = async (games: Record<string, InternalGame>): Promise<void> => {
  const snapshot = Object.fromEntries(
    Object.entries(games).map(([gameId, game]) => [
      gameId,
      {
        metadata: game.metadata,
        events: game.events.map((event) => ({
          id: event.id,
          sequence: event.sequence,
          createdAt: event.createdAt,
          createdBy: event.createdBy,
          deviceId: event.deviceId,
          input: event.input,
        })),
        lastUpdated: Date.now()
      }
    ])
  );

  await saveScorecardSnapshot(snapshot);
};

const nextSequence = (game: InternalGame): number => {
  if (!game.events.length) {
    return 1;
  }

  return Math.max(...game.events.map((event) => event.sequence)) + 1;
};

export const useScorecardStore = createStore<ScorecardState>((set, get) => ({
  hydrated: false,
  status: 'idle',
  error: null,
  activeGameId: null,
  games: {},
  hydrate: async () => {
    if (get().hydrated) {
      return;
    }

    set({ status: 'loading', error: null });
    try {
      const stored = await loadScorecardSnapshot();
      if (!stored) {
        set({ hydrated: true, status: 'idle' });
        return;
      }

      const games = Object.fromEntries(
        Object.entries(stored).map(([gameId, record]) => {
          const events: ScoreEvent[] = record.events
            .map((storedEvent) => ({
              id: storedEvent.id,
              sequence: storedEvent.sequence,
              gameId,
              createdAt: storedEvent.createdAt,
              createdBy: storedEvent.createdBy,
              deviceId: storedEvent.deviceId,
              notation: '',
              summary: '',
              input: storedEvent.input,
              inning: 1,
              half: 'top',
              outsBefore: 0,
              outsAfter: 0,
              scoreAfter: INITIAL_STATE().score,
              basesAfter: INITIAL_STATE().bases
            }))
            .sort((a, b) => a.sequence - b.sequence);

          return [gameId, buildGame(record.metadata, events)];
        })
      );

      set({
        games,
        hydrated: true,
        status: 'idle',
        error: null
      });
    } catch (error) {
      set({
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to load scorecard',
        hydrated: true
      });
    }
  },
  setActiveGame: async (initializer: ScorecardInitializer) => {
    const metadata: ScorecardMetadata = {
      gameId: initializer.id,
      homeTeam: initializer.homeTeam.name,
      awayTeam: initializer.visitorTeam.name,
      field: initializer.field?.name ?? null,
      scheduledStart: initializer.startsAt
    };

    set((state) => {
      if (state.games[metadata.gameId]) {
        return { activeGameId: metadata.gameId };
      }

      const game = buildGame(metadata, []);
      return {
        activeGameId: metadata.gameId,
        games: {
          ...state.games,
          [metadata.gameId]: game
        }
      };
    });

    await persistGames(get().games);
  },
  recordEvent: async (gameId, input, context) => {
    const state = get();
    const game = state.games[gameId];
    if (!game) {
      throw new Error('Game not initialized');
    }

    const sequence = nextSequence(game);
    const newEvent: ScoreEvent = {
      id: generateId('event'),
      sequence,
      gameId,
      createdAt: new Date().toISOString(),
      createdBy: context.userName,
      deviceId: context.deviceId,
      notation: '',
      summary: '',
      input,
      inning: game.state.inning,
      half: game.state.half,
      outsBefore: game.state.outs,
      outsAfter: game.state.outs,
      scoreAfter: game.state.score,
      basesAfter: game.state.bases
    };

    set((prev) => {
      const nextGame = recomputeGame({
        ...prev.games[gameId],
        events: [...prev.games[gameId].events, newEvent]
      });

      return {
        games: {
          ...prev.games,
          [gameId]: nextGame
        }
      };
    });

    await persistGames(get().games);

    const updatedGame = get().games[gameId];
    return updatedGame.events.find((event) => event.id === newEvent.id)!;
  },
  undo: async (gameId) => {
    const state = get();
    const game = state.games[gameId];
    if (!game || !game.events.length) {
      return;
    }

    const lastEvent = game.events[game.events.length - 1];

    set((prev) => {
      const currentGame = prev.games[gameId];
      const updatedEvents = currentGame.events.slice(0, -1);
      const redoStack = [lastEvent, ...currentGame.redoStack];

      return {
        games: {
          ...prev.games,
          [gameId]: recomputeGame({
            ...currentGame,
            events: updatedEvents,
            redoStack
          })
        }
      };
    });

    await persistGames(get().games);
  },
  redo: async (gameId) => {
    const state = get();
    const game = state.games[gameId];
    if (!game || !game.redoStack.length) {
      return;
    }

    const [nextEvent, ...remainingRedo] = game.redoStack;

    set((prev) => {
      const currentGame = prev.games[gameId];
      return {
        games: {
          ...prev.games,
          [gameId]: recomputeGame({
            ...currentGame,
            events: [...currentGame.events, nextEvent],
            redoStack: remainingRedo
          })
        }
      };
    });

    await persistGames(get().games);
  },
  editEvent: async (gameId, eventId, input) => {
    const state = get();
    const game = state.games[gameId];
    if (!game) {
      throw new Error('Game not initialized');
    }

    const eventIndex = game.events.findIndex((event) => event.id === eventId);
    if (eventIndex === -1) {
      throw new Error('Event not found');
    }

    set((prev) => {
      const currentGame = prev.games[gameId];
      const updatedEvents = currentGame.events.map((event) =>
        event.id === eventId
          ? {
              ...event,
              input,
              notation: '',
              summary: ''
            }
          : event
      );

      return {
        games: {
          ...prev.games,
          [gameId]: recomputeGame({
            ...currentGame,
            events: updatedEvents,
            redoStack: []
          })
        }
      };
    });

    await persistGames(get().games);
  },
  deleteEvent: async (gameId, eventId) => {
    const state = get();
    const game = state.games[gameId];
    if (!game) {
      return;
    }

    set((prev) => {
      const currentGame = prev.games[gameId];
      const updatedEvents = currentGame.events.filter((event) => event.id !== eventId);

      return {
        games: {
          ...prev.games,
          [gameId]: recomputeGame({
            ...currentGame,
            events: updatedEvents,
            redoStack: []
          })
        }
      };
    });

    await persistGames(get().games);
  },
  clearGame: async (gameId) => {
    set((prev) => {
      const nextGames = { ...prev.games };
      delete nextGames[gameId];
      return {
        games: nextGames,
        activeGameId: prev.activeGameId === gameId ? null : prev.activeGameId
      };
    });

    await persistGames(get().games);
  }
}));

export const selectActiveGame = (state: ScorecardState): InternalGame | null => {
  if (!state.activeGameId) {
    return null;
  }
  return state.games[state.activeGameId] ?? null;
};

export const selectGameById = (state: ScorecardState, gameId: string): InternalGame | undefined =>
  state.games[gameId];

export const selectScorecardStatus = (state: ScorecardState): ScorecardStatus => state.status;
