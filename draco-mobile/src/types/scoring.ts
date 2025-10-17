import type { UpcomingGame } from './schedule';

export type InningHalf = 'top' | 'bottom';
export type BaseName = 'first' | 'second' | 'third';

export type RunnerState = {
  id: string;
  name: string;
};

export type BasesState = {
  first: RunnerState | null;
  second: RunnerState | null;
  third: RunnerState | null;
};

export type ScoreByTeam = {
  home: number;
  away: number;
};

export type AtBatResult =
  | 'single'
  | 'double'
  | 'triple'
  | 'home_run'
  | 'walk'
  | 'hit_by_pitch'
  | 'strikeout_swinging'
  | 'strikeout_looking'
  | 'ground_out'
  | 'fly_out'
  | 'sacrifice_fly'
  | 'reach_on_error'
  | 'fielders_choice';

export type RunnerAdvance = {
  runner: RunnerState;
  start: BaseName | 'batter';
  end: BaseName | 'home' | 'out';
  rbis?: number;
};

export type PlayEventInput = {
  type: 'at_bat';
  batter: RunnerState;
  result: AtBatResult;
  advances: RunnerAdvance[];
  notes?: string;
  pitches?: number;
};

export type RunnerEventInput = {
  type: 'runner';
  runner: RunnerState;
  from: BaseName;
  to: BaseName | 'home' | 'out';
  action: 'stolen_base' | 'caught_stealing' | 'pickoff' | 'advance';
  notes?: string;
};

export type SubstitutionRole = 'batter' | 'runner' | 'pitcher' | 'fielder';

export type SubstitutionEventInput = {
  type: 'substitution';
  role: SubstitutionRole;
  outgoing?: RunnerState | null;
  incoming: RunnerState;
  position?: string;
  notes?: string;
};

export type ScoreEventInput = PlayEventInput | RunnerEventInput | SubstitutionEventInput;

export type GameScoreState = {
  inning: number;
  half: InningHalf;
  outs: number;
  bases: BasesState;
  score: ScoreByTeam;
};

export type DerivedPitchingStats = {
  totalPitches: number;
};

export type DerivedBattingLine = {
  atBats: number;
  runs: number;
  hits: number;
  rbi: number;
  walks: number;
  strikeouts: number;
};

export type DerivedStats = {
  pitching: DerivedPitchingStats;
  batting: DerivedBattingLine;
};

export type ScoreEvent = {
  id: string;
  sequence: number;
  gameId: string;
  createdAt: string;
  createdBy: string;
  deviceId: string;
  notation: string;
  summary: string;
  input: ScoreEventInput;
  inning: number;
  half: InningHalf;
  outsBefore: number;
  outsAfter: number;
  scoreAfter: ScoreByTeam;
  basesAfter: BasesState;
};

export type ScorecardMetadata = {
  gameId: string;
  scheduledStart?: string;
  homeTeam: string;
  awayTeam: string;
  field?: string | null;
};

export type ScorecardGame = {
  metadata: ScorecardMetadata;
  state: GameScoreState;
  events: ScoreEvent[];
  redoStack: ScoreEvent[];
  derived: DerivedStats;
};

export type ScorecardSnapshot = {
  schemaVersion: number;
  storedAt: number;
  games: Record<string, ScorecardStoredGame>;
};

export type ScorecardStoredEvent = {
  id: string;
  input: ScoreEventInput;
  createdAt: string;
  createdBy: string;
  deviceId: string;
  sequence: number;
};

export type ScorecardStoredGame = {
  metadata: ScorecardMetadata;
  events: ScorecardStoredEvent[];
  lastUpdated: number;
};

export type ScorecardInitializer = Pick<UpcomingGame, 'id' | 'homeTeam' | 'visitorTeam' | 'field' | 'startsAt'>;
