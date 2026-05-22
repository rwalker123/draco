import type { SeasonStandingsResponse } from '@draco/shared-api-client';

export interface ShapedRecord {
  w: number;
  l: number;
  t: number;
}

export interface ShapedTeamStanding {
  rank: number;
  team_season_id: string;
  team_name: string;
  league_season_id: string | null;
  league_name: string | null;
  division_season_id: string | null;
  division_name: string | null;
  w: number;
  l: number;
  t: number;
  pct: number;
  gb: number;
  division_record: ShapedRecord | null;
}

export interface ShapedDivisionStandings {
  division_season_id: string;
  division_name: string;
  teams: ShapedTeamStanding[];
}

export interface ShapedLeagueStandings {
  league_season_id: string;
  league_name: string;
  divisions: ShapedDivisionStandings[];
}

export interface ShapedGroupedStandings {
  summary: string;
  season_id: string;
  grouped: true;
  leagues: ShapedLeagueStandings[];
}

export interface ShapedFlatStandings {
  summary: string;
  season_id: string;
  grouped: false;
  teams: ShapedTeamStanding[];
}

function isGroupedResponse(
  data: SeasonStandingsResponse,
): data is Extract<SeasonStandingsResponse, Array<{ divisions: unknown }>> {
  return data.length > 0 && 'divisions' in (data[0] as object);
}

function shapeFlatTeam(
  team: Extract<SeasonStandingsResponse, Array<unknown>>[number] & {
    w?: number;
    l?: number;
    t?: number;
    team: { id: string; name?: string };
    pct?: number;
    gb?: number;
    league?: { id: string; name: string };
    division?: { id: string; name: string };
    divisionRecord?: ShapedRecord;
  },
  rank: number,
): ShapedTeamStanding {
  return {
    rank,
    team_season_id: team.team.id,
    team_name: team.team.name ?? 'Unknown',
    league_season_id: team.league?.id ?? null,
    league_name: team.league?.name ?? null,
    division_season_id: team.division?.id ?? null,
    division_name: team.division?.name ?? null,
    w: team.w ?? 0,
    l: team.l ?? 0,
    t: team.t ?? 0,
    pct: team.pct ?? 0,
    gb: team.gb ?? 0,
    division_record: team.divisionRecord ?? null,
  };
}

export function shapeGroupedStandings(
  data: SeasonStandingsResponse,
  seasonId: string,
  leagueFilter?: string,
): ShapedGroupedStandings {
  const leagues = isGroupedResponse(data) ? data : [];

  const shapedLeagues: ShapedLeagueStandings[] = leagues
    .filter((l) => !leagueFilter || l.league.id === leagueFilter)
    .map((l) => ({
      league_season_id: l.league.id,
      league_name: l.league.name,
      divisions: l.divisions.map((d) => {
        const divEntry = d.division;
        const divisionName =
          (divEntry as unknown as { division?: { name?: string } }).division?.name ?? 'Unknown';
        return {
          division_season_id: divEntry.id,
          division_name: divisionName,
          teams: d.teams.map((t, idx) =>
            shapeFlatTeam(t as Parameters<typeof shapeFlatTeam>[0], idx + 1),
          ),
        };
      }),
    }));

  const totalTeams = shapedLeagues.reduce(
    (sum, l) => sum + l.divisions.reduce((s, d) => s + d.teams.length, 0),
    0,
  );

  const summary =
    shapedLeagues.length === 0
      ? leagueFilter
        ? `No standings found for the specified league in this season.`
        : 'No standings available for this season.'
      : `Standings for ${shapedLeagues.length} league${shapedLeagues.length === 1 ? '' : 's'} (${totalTeams} team${totalTeams === 1 ? '' : 's'} total).`;

  return { summary, season_id: seasonId, grouped: true, leagues: shapedLeagues };
}

export function shapeFlatStandings(
  data: SeasonStandingsResponse,
  seasonId: string,
  leagueFilter?: string,
): ShapedFlatStandings {
  const flat = isGroupedResponse(data) ? [] : (data as Array<Parameters<typeof shapeFlatTeam>[0]>);

  const filtered = flat.filter((t) => !leagueFilter || t.league?.id === leagueFilter);
  const teams = filtered.map((t, idx) => shapeFlatTeam(t, idx + 1));

  const summary =
    teams.length === 0
      ? leagueFilter
        ? 'No teams found for the specified league in this season.'
        : 'No standings available for this season.'
      : `Standings for ${teams.length} team${teams.length === 1 ? '' : 's'}.`;

  return { summary, season_id: seasonId, grouped: false, teams };
}
