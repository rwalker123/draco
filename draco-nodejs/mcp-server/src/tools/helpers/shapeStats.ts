import type { PlayerCareerStatistics } from '@draco/shared-api-client';

export interface ShapedBattingRow {
  level: string;
  season_name: string | null;
  team_name: string | null;
  ab: number;
  h: number;
  r: number;
  '2b': number;
  '3b': number;
  hr: number;
  rbi: number;
  bb: number;
  so: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
}

export interface ShapedPitchingRow {
  level: string;
  season_name: string | null;
  team_name: string | null;
  ip: number;
  w: number;
  l: number;
  s: number;
  h: number;
  r: number;
  er: number;
  bb: number;
  so: number;
  hr: number;
  era: number;
  whip: number;
}

export interface ShapedBattingStats {
  summary: string;
  player_name: string;
  rows: ShapedBattingRow[];
}

export interface ShapedPitchingStats {
  summary: string;
  player_name: string;
  rows: ShapedPitchingRow[];
}

export function shapeBattingStats(stats: PlayerCareerStatistics): ShapedBattingStats {
  const rows: ShapedBattingRow[] = stats.batting.rows.map((r) => ({
    level: r.level,
    season_name: r.seasonName ?? null,
    team_name: r.teamName ?? null,
    ab: r.ab,
    h: r.h,
    r: r.r,
    '2b': r.d,
    '3b': r.t,
    hr: r.hr,
    rbi: r.rbi,
    bb: r.bb,
    so: r.so,
    avg: r.avg,
    obp: r.obp,
    slg: r.slg,
    ops: r.ops,
  }));

  const summary =
    rows.length === 0
      ? `No batting statistics available for ${stats.playerName}.`
      : `Career batting statistics for ${stats.playerName}.`;

  return { summary, player_name: stats.playerName, rows };
}

export function shapePitchingStats(stats: PlayerCareerStatistics): ShapedPitchingStats {
  const rows: ShapedPitchingRow[] = stats.pitching.rows.map((r) => ({
    level: r.level,
    season_name: r.seasonName ?? null,
    team_name: r.teamName ?? null,
    ip: r.ip,
    w: r.w,
    l: r.l,
    s: r.s,
    h: r.h,
    r: r.r,
    er: r.er,
    bb: r.bb,
    so: r.so,
    hr: r.hr,
    era: r.era,
    whip: r.whip,
  }));

  const summary =
    rows.length === 0
      ? `No pitching statistics available for ${stats.playerName}.`
      : `Career pitching statistics for ${stats.playerName}.`;

  return { summary, player_name: stats.playerName, rows };
}
