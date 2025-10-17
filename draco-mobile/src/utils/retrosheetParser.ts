import type {
  AtBatResult,
  RunnerAdvance,
  RunnerEventInput,
  ScoreEventInput,
  SubstitutionEventInput
} from '../types/scoring';

const RESULT_CODES: Record<AtBatResult, string> = {
  single: 'S',
  double: 'D',
  triple: 'T',
  home_run: 'HR',
  walk: 'W',
  hit_by_pitch: 'HP',
  strikeout_swinging: 'K',
  strikeout_looking: 'Kc',
  ground_out: 'G',
  fly_out: 'F',
  sacrifice_fly: 'SF',
  reach_on_error: 'E',
  fielders_choice: 'FC'
};

const BASE_MAP: Record<RunnerAdvance['start'], string> = {
  batter: 'B',
  first: '1',
  second: '2',
  third: '3'
};

const END_MAP: Record<Exclude<RunnerAdvance['end'], 'out'>, string> = {
  home: 'H',
  first: '1',
  second: '2',
  third: '3'
};

const RUNNER_ACTION_CODES: Record<RunnerEventInput['action'], string> = {
  stolen_base: 'SB',
  caught_stealing: 'CS',
  pickoff: 'PO',
  advance: 'ADV'
};

const SUBSTITUTION_CODES: Record<SubstitutionEventInput['role'], string> = {
  batter: 'SUBB',
  runner: 'SUBR',
  pitcher: 'SUBP',
  fielder: 'SUBF'
};

export function formatRunnerAdvance(advance: RunnerAdvance): string {
  const start = BASE_MAP[advance.start];
  if (advance.end === 'out') {
    return `${start}-X`;
  }

  const end = END_MAP[advance.end];
  return `${start}-${end}`;
}

export function formatAdvances(advances: RunnerAdvance[]): string {
  if (!advances.length) {
    return '';
  }

  return advances.map(formatRunnerAdvance).join(';');
}

export function formatPlayResult(result: AtBatResult, advances: RunnerAdvance[]): string {
  const base = RESULT_CODES[result];
  const advance = formatAdvances(advances);
  return advance ? `${base};${advance}` : base;
}

function formatRunnerEvent(input: RunnerEventInput): string {
  const code = RUNNER_ACTION_CODES[input.action];
  const start = BASE_MAP[input.from];
  if (input.to === 'out') {
    return `${code}${start}X`;
  }

  const end = END_MAP[input.to];
  return `${code}${start}${end}`;
}

function formatSubstitution(input: SubstitutionEventInput): string {
  const code = SUBSTITUTION_CODES[input.role];
  const incoming = input.incoming.name.trim() || 'Unknown';
  const outgoing = input.outgoing?.name ? `/${input.outgoing.name.trim()}` : '';
  const position = input.position ? `-${input.position}` : '';
  return `${code}:${incoming}${outgoing}${position}`;
}

export function formatRetrosheetNotation(input: ScoreEventInput): string {
  switch (input.type) {
    case 'at_bat':
      return formatPlayResult(input.result, input.advances);
    case 'runner':
      return formatRunnerEvent(input);
    case 'substitution':
      return formatSubstitution(input);
    default: {
      input satisfies never;
      return '';
    }
  }
}

export function describeScoreEvent(input: ScoreEventInput): string {
  switch (input.type) {
    case 'at_bat': {
      const batter = input.batter.name || 'Batter';
      const label = RESULT_CODES[input.result] ?? input.result;
      return `${batter} – ${label}`;
    }
    case 'runner':
      return `${input.runner.name || 'Runner'} – ${RUNNER_ACTION_CODES[input.action]}`;
    case 'substitution':
      return `Substitution – ${input.incoming.name}`;
    default: {
      input satisfies never;
      return '';
    }
  }
}
