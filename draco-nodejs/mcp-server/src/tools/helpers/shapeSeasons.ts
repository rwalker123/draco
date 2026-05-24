import type { LeagueSeasonWithDivision } from '@draco/shared-api-client';

export interface ShapedDivision {
  division_season_id: string;
  division_name: string;
}

export interface ShapedLeague {
  league_season_id: string;
  league_name: string;
  divisions: ShapedDivision[];
}

export interface ShapedSeason {
  season_id: string;
  season_name: string;
  is_current: boolean;
  schedule_visible: boolean;
  leagues: ShapedLeague[];
}

export interface ShapedSeasonsResult {
  summary: string;
  count: number;
  seasons: ShapedSeason[];
}

export function shapeSeasons(seasons: LeagueSeasonWithDivision[]): ShapedSeasonsResult {
  const shaped: ShapedSeason[] = seasons.map((s) => ({
    season_id: s.id,
    season_name: s.name,
    is_current: s.isCurrent ?? false,
    schedule_visible: s.scheduleVisible,
    leagues: s.leagues.map((l) => ({
      league_season_id: l.id,
      league_name: l.league.name,
      divisions: (l.divisions ?? []).map((d) => ({
        division_season_id: d.id,
        division_name: d.division.name,
      })),
    })),
  }));

  return {
    summary: `${shaped.length} season${shaped.length === 1 ? '' : 's'} in this account.`,
    count: shaped.length,
    seasons: shaped,
  };
}
