export enum GolfMatchStatus {
  SCHEDULED = 0,
  COMPLETED = 1,
  RAINOUT = 2,
  POSTPONED = 3,
  FORFEIT = 4,
}

export enum AbsentPlayerMode {
  OPPONENT_WINS = 0,
  HANDICAP_PENALTY = 1,
  SKIP_PAIRING = 2,
}

export enum FullTeamAbsentMode {
  FORFEIT = 0,
  HANDICAP_PENALTY = 1,
}

import type { HandicapStrokeMethodType } from '@draco/shared-schemas';

export const DEFAULT_HANDICAP_STROKE_METHOD: HandicapStrokeMethodType = 'full';

const VALID_HANDICAP_STROKE_METHODS: Set<string> = new Set(['full', 'matchPlay']);

export function toHandicapStrokeMethod(value: string | null | undefined): HandicapStrokeMethodType {
  return VALID_HANDICAP_STROKE_METHODS.has(value ?? '')
    ? (value as HandicapStrokeMethodType)
    : DEFAULT_HANDICAP_STROKE_METHOD;
}
