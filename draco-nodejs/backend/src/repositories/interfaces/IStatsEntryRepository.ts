import {
  dbGameAttendance,
  dbGameBattingStat,
  dbGamePitchingStat,
  dbStatsEntryGame,
} from '../types/dbTypes.js';

export type BattingStatValues = {
  ab: number;
  h: number;
  r: number;
  d: number;
  t: number;
  hr: number;
  rbi: number;
  so: number;
  bb: number;
  hbp: number;
  sb: number;
  cs: number;
  sf: number;
  sh: number;
  re: number;
  intr: number;
  lob: number;
};

export type PitchingStatValues = {
  ip: number;
  ip2: number;
  bf: number;
  w: number;
  l: number;
  s: number;
  h: number;
  r: number;
  er: number;
  d: number;
  t: number;
  hr: number;
  so: number;
  bb: number;
  wp: number;
  hbp: number;
  bk: number;
  sc: number;
};

export interface IStatsEntryRepository {
  listCompletedGames(teamSeasonId: bigint, leagueSeasonId: bigint): Promise<dbStatsEntryGame[]>;
  findTeamGame(
    gameId: bigint,
    teamSeasonId: bigint,
    leagueSeasonId: bigint,
  ): Promise<dbStatsEntryGame | null>;
  listGameBattingStats(gameId: bigint, teamSeasonId: bigint): Promise<dbGameBattingStat[]>;
  findBattingStatById(statId: bigint): Promise<dbGameBattingStat | null>;
  createGameBattingStat(
    gameId: bigint,
    teamSeasonId: bigint,
    rosterSeasonId: bigint,
    values: BattingStatValues,
  ): Promise<dbGameBattingStat>;
  updateGameBattingStat(statId: bigint, values: BattingStatValues): Promise<dbGameBattingStat>;
  deleteGameBattingStat(statId: bigint): Promise<void>;

  listGamePitchingStats(gameId: bigint, teamSeasonId: bigint): Promise<dbGamePitchingStat[]>;
  findPitchingStatById(statId: bigint): Promise<dbGamePitchingStat | null>;
  createGamePitchingStat(
    gameId: bigint,
    teamSeasonId: bigint,
    rosterSeasonId: bigint,
    values: PitchingStatValues,
  ): Promise<dbGamePitchingStat>;
  updateGamePitchingStat(statId: bigint, values: PitchingStatValues): Promise<dbGamePitchingStat>;
  deleteGamePitchingStat(statId: bigint): Promise<void>;

  listAttendance(gameId: bigint, teamSeasonId: bigint): Promise<dbGameAttendance[]>;
  replaceAttendance(gameId: bigint, teamSeasonId: bigint, playerIds: bigint[]): Promise<void>;
  addAttendance(gameId: bigint, teamSeasonId: bigint, playerId: bigint): Promise<void>;
  removeAttendance(gameId: bigint, teamSeasonId: bigint, playerId: bigint): Promise<void>;
}
