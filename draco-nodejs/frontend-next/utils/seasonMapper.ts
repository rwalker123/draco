import type { LeagueSeasonWithDivisionType, SeasonType } from '@draco/shared-schemas';

export interface SeasonDivisionSummary {
  id: string;
  name: string;
  priority?: number;
}

export interface SeasonLeagueSummary {
  id: string;
  leagueId: string;
  leagueName: string;
  divisions: SeasonDivisionSummary[];
}

export interface SeasonSummary {
  id: string;
  name: string;
  accountId: string;
  isCurrent: boolean;
  leagues: SeasonLeagueSummary[];
}

type LeagueSeasonWithDivisions = NonNullable<
  NonNullable<LeagueSeasonWithDivisionType['leagues']>[number]
>;

export const mapLeagueSeasonWithDivisions = (
  leagueSeason: LeagueSeasonWithDivisions,
): SeasonLeagueSummary => ({
  id: leagueSeason.id,
  leagueId: leagueSeason.league.id,
  leagueName: leagueSeason.league.name,
  divisions: (leagueSeason.divisions ?? []).map((divisionSeason) => ({
    id: divisionSeason.id,
    name: divisionSeason.division.name,
    priority: divisionSeason.priority,
  })),
});

export const mapSeasonWithDivisions = (season: LeagueSeasonWithDivisionType): SeasonSummary => ({
  id: season.id,
  name: season.name,
  accountId: season.accountId,
  isCurrent: Boolean(season.isCurrent),
  leagues: (season.leagues ?? []).map(mapLeagueSeasonWithDivisions),
});

export const mapSeasonsWithDivisions = (
  seasons: LeagueSeasonWithDivisionType[] | undefined,
): SeasonSummary[] => {
  if (!seasons) {
    return [];
  }

  return seasons.map(mapSeasonWithDivisions);
};

export const mapSeasonUpdate = (season: SeasonType): Partial<SeasonSummary> & { id: string } => ({
  id: season.id,
  name: season.name,
  accountId: season.accountId,
  isCurrent: Boolean(season.isCurrent),
});
