import type {
  BaseName,
  RunnerEventInput,
  RunnerState,
  ScoreEventInput,
  ScorecardGame
} from '../../types/scoring';

export const runnerBaseOrder: BaseName[] = ['first', 'second', 'third'];

export type RunnerFormState = {
  runnerId: string | null;
  runner: RunnerState | null;
  base: BaseName | null;
  action: RunnerEventInput['action'];
  destination: RunnerEventInput['to'];
  notes: string;
};

export const initialRunnerState = (): RunnerFormState => ({
  runnerId: null,
  runner: null,
  base: null,
  action: 'stolen_base',
  destination: 'second',
  notes: ''
});

export const getRunnerFromGame = (
  game: ScorecardGame,
  runnerId: string | null
): { base: BaseName; runner: RunnerState } | null => {
  if (!runnerId) {
    return null;
  }

  for (const base of runnerBaseOrder) {
    const occupant = game.state.bases[base];
    if (occupant?.id === runnerId) {
      return { base, runner: occupant };
    }
  }

  return null;
};

export const buildRunnerInput = (
  game: ScorecardGame,
  state: RunnerFormState
): ScoreEventInput | null => {
  if (!state.runnerId) {
    return null;
  }

  const found = getRunnerFromGame(game, state.runnerId);
  const runner = state.runner ?? found?.runner;
  const fromBase = state.base ?? found?.base ?? null;

  if (!runner || !fromBase) {
    return null;
  }

  let destination: RunnerEventInput['to'] = state.destination;
  if (state.action === 'caught_stealing' || state.action === 'pickoff') {
    destination = 'out';
  }

  return {
    type: 'runner',
    runner,
    from: fromBase,
    to: destination,
    action: state.action,
    notes: state.notes || undefined
  };
};
