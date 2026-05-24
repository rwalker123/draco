import type { PlayerBattingStats, PlayerPitchingStats } from '@draco/shared-api-client';

export interface ShapedTeamBattingRow {
  player_id: string;
  player_name: string;
  team_name: string;
  ab: number;
  h: number;
  r: number;
  '2b': number;
  '3b': number;
  hr: number;
  rbi: number;
  bb: number;
  so: number;
  sb: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
}

export interface ShapedTeamPitchingRow {
  player_id: string;
  player_name: string;
  team_name: string;
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

export interface ShapedTeamBattingStatsResult {
  summary: string;
  stat_type: 'batting';
  count: number;
  rows: ShapedTeamBattingRow[];
}

export interface ShapedTeamPitchingStatsResult {
  summary: string;
  stat_type: 'pitching';
  count: number;
  rows: ShapedTeamPitchingRow[];
}

export function shapeTeamBattingStats(rows: PlayerBattingStats[]): ShapedTeamBattingStatsResult {
  const shaped: ShapedTeamBattingRow[] = rows.map((r) => ({
    player_id: r.playerId,
    player_name: r.playerName,
    team_name: r.teamName,
    ab: r.ab,
    h: r.h,
    r: r.r,
    '2b': r.d,
    '3b': r.t,
    hr: r.hr,
    rbi: r.rbi,
    bb: r.bb,
    so: r.so,
    sb: r.sb,
    avg: r.avg,
    obp: r.obp,
    slg: r.slg,
    ops: r.ops,
  }));

  return {
    summary:
      shaped.length === 0
        ? 'No batting statistics available for this team.'
        : `Batting statistics for ${shaped.length} player${shaped.length === 1 ? '' : 's'}.`,
    stat_type: 'batting',
    count: shaped.length,
    rows: shaped,
  };
}

export function shapeTeamPitchingStats(rows: PlayerPitchingStats[]): ShapedTeamPitchingStatsResult {
  const shaped: ShapedTeamPitchingRow[] = rows.map((r) => ({
    player_id: r.playerId,
    player_name: r.playerName,
    team_name: r.teamName,
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

  return {
    summary:
      shaped.length === 0
        ? 'No pitching statistics available for this team.'
        : `Pitching statistics for ${shaped.length} player${shaped.length === 1 ? '' : 's'}.`,
    stat_type: 'pitching',
    count: shaped.length,
    rows: shaped,
  };
}
