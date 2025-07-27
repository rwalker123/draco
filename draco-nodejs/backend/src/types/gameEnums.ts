// Game status enum - matches frontend types/schedule.ts
export enum GameStatus {
  Scheduled = 0,
  Completed = 1,
  Rainout = 2,
  Postponed = 3,
  Forfeit = 4,
  DidNotReport = 5,
}

// Game type enum - matches frontend types/schedule.ts
export enum GameType {
  RegularSeason = 0,
  Playoff = 1,
  Exhibition = 2,
}
