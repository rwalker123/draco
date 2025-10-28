'use client';

import type {
  GameAttendanceType,
  UpdateGameBattingStatType,
  UpdateGamePitchingStatType,
} from '@draco/shared-schemas';

export const defaultCreateBattingValues = {
  rosterSeasonId: '',
  ab: 0,
  h: 0,
  r: 0,
  d: 0,
  t: 0,
  hr: 0,
  rbi: 0,
  so: 0,
  bb: 0,
  hbp: 0,
  sb: 0,
  cs: 0,
  sf: 0,
  sh: 0,
  re: 0,
  intr: 0,
  lob: 0,
};

export const defaultUpdateBattingValues: UpdateGameBattingStatType = {
  ab: 0,
  h: 0,
  r: 0,
  d: 0,
  t: 0,
  hr: 0,
  rbi: 0,
  so: 0,
  bb: 0,
  hbp: 0,
  sb: 0,
  cs: 0,
  sf: 0,
  sh: 0,
  re: 0,
  intr: 0,
  lob: 0,
};

export const defaultCreatePitchingValues = {
  rosterSeasonId: '',
  ipDecimal: 0,
  w: 0,
  l: 0,
  s: 0,
  h: 0,
  r: 0,
  er: 0,
  d: 0,
  t: 0,
  hr: 0,
  so: 0,
  bb: 0,
  bf: 0,
  wp: 0,
  hbp: 0,
  bk: 0,
  sc: 0,
};

export const defaultUpdatePitchingValues: UpdateGamePitchingStatType = {
  ipDecimal: 0,
  w: 0,
  l: 0,
  s: 0,
  h: 0,
  r: 0,
  er: 0,
  d: 0,
  t: 0,
  hr: 0,
  so: 0,
  bb: 0,
  bf: 0,
  wp: 0,
  hbp: 0,
  bk: 0,
  sc: 0,
};

export const emptyAttendance: GameAttendanceType = {
  playerIds: [],
};
