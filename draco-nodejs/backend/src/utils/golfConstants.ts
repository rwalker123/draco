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
