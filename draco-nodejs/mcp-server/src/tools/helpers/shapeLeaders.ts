import type { LeaderRow, LeaderCategories } from '@draco/shared-api-client';

export interface ShapedLeader {
  rank: number;
  player_id: string;
  player_name: string;
  team_name: string;
  teams: string[] | null;
  value: number;
  is_tie: boolean;
  tie_count: number | null;
}

export interface ShapedLeadersResult {
  summary: string;
  category: string;
  count: number;
  leaders: ShapedLeader[];
}

export function shapeLeaders(rows: LeaderRow[], category: string): ShapedLeadersResult {
  const shaped: ShapedLeader[] = rows.map((r) => ({
    rank: r.rank,
    player_id: r.playerId,
    player_name: r.playerName,
    team_name: r.teamName,
    teams: r.teams ?? null,
    value: r.statValue,
    is_tie: r.isTie ?? false,
    tie_count: r.tieCount ?? null,
  }));

  return {
    summary:
      shaped.length === 0
        ? `No leaders found for ${category}.`
        : `Top ${shaped.length} for ${category}.`,
    category,
    count: shaped.length,
    leaders: shaped,
  };
}

export interface ShapedLeaderCategoryItem {
  key: string;
  label: string;
  format: string;
}

export interface ShapedLeaderCategoriesResult {
  summary: string;
  batting: ShapedLeaderCategoryItem[];
  pitching: ShapedLeaderCategoryItem[];
}

export function shapeLeaderCategories(cats: LeaderCategories): ShapedLeaderCategoriesResult {
  return {
    summary: `${cats.batting.length} batting and ${cats.pitching.length} pitching leader categories available.`,
    batting: cats.batting.map((c) => ({ key: c.key, label: c.label, format: c.format })),
    pitching: cats.pitching.map((c) => ({ key: c.key, label: c.label, format: c.format })),
  };
}
