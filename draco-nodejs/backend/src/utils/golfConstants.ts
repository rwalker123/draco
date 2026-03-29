import { HandicapStrokeMethodEnum, type HandicapStrokeMethodType } from '@draco/shared-schemas';

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

export const DEFAULT_HANDICAP_STROKE_METHOD: HandicapStrokeMethodType = 'full';

export function toHandicapStrokeMethod(value: string | null | undefined): HandicapStrokeMethodType {
  const parsed = HandicapStrokeMethodEnum.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_HANDICAP_STROKE_METHOD;
}
