import type {
  LeagueSetupType,
  LeagueSeasonWithDivisionTeamsAndUnassignedType,
  DivisionSeasonWithTeamsType,
  TeamSeasonWithPlayerCountType,
} from '@draco/shared-schemas';

export interface LeagueSeasonTeam {
  id: string;
  teamId: string;
  name: string;
  webAddress: string | null;
  youtubeUserId: string | null;
  defaultVideo: string | null;
  autoPlayVideo: boolean;
  logoUrl: string | null;
  playerCount?: number;
  managerCount?: number;
}

export interface LeagueSeasonDivision {
  id: string;
  divisionId: string;
  divisionName: string;
  priority: number;
  teams: LeagueSeasonTeam[];
  teamCount: number;
  totalPlayers: number;
  totalManagers: number;
}

export interface LeagueSeasonSummary {
  id: string;
  leagueId: string;
  leagueName: string;
  accountId: string;
  divisions: LeagueSeasonDivision[];
  unassignedTeams: LeagueSeasonTeam[];
  totalTeams: number;
  totalPlayers: number;
  totalManagers: number;
  unassignedTeamCount: number;
}

export interface LeagueSetupSummary {
  season: {
    id: string;
    name: string;
    accountId: string;
  } | null;
  leagueSeasons: LeagueSeasonSummary[];
}

const mapTeam = (team: TeamSeasonWithPlayerCountType): LeagueSeasonTeam => ({
  id: team.id,
  teamId: team.team.id,
  name: team.name || '',
  webAddress: team.team.webAddress ?? null,
  youtubeUserId: team.team.youtubeUserId ?? null,
  defaultVideo: team.team.defaultVideo ?? null,
  autoPlayVideo: team.team.autoPlayVideo ?? false,
  logoUrl: team.team.logoUrl ?? null,
  playerCount: team.playerCount,
  managerCount: team.managerCount,
});

const mapDivision = (division: DivisionSeasonWithTeamsType) => {
  const teams = (division.teams ?? []).map(mapTeam);

  const teamCount = teams.length;
  const totalPlayers = teams.reduce((sum, team) => sum + (team.playerCount ?? 0), 0);
  const totalManagers = teams.reduce((sum, team) => sum + (team.managerCount ?? 0), 0);

  return {
    id: division.id,
    divisionId: division.division.id,
    divisionName: division.division.name,
    priority: division.priority,
    teams,
    teamCount,
    totalPlayers,
    totalManagers,
  } satisfies LeagueSeasonDivision;
};

const mapLeagueSeason = (
  leagueSeason: LeagueSeasonWithDivisionTeamsAndUnassignedType,
  accountIdFallback: string,
) => {
  const divisions = (leagueSeason.divisions ?? []).map(mapDivision);
  const unassignedTeams = (leagueSeason.unassignedTeams ?? []).map(mapTeam);

  const totalDivisionTeams = divisions.reduce((sum, division) => sum + division.teamCount, 0);
  const totalDivisionPlayers = divisions.reduce((sum, division) => sum + division.totalPlayers, 0);
  const totalDivisionManagers = divisions.reduce(
    (sum, division) => sum + division.totalManagers,
    0,
  );

  const unassignedPlayers = unassignedTeams.reduce((sum, team) => sum + (team.playerCount ?? 0), 0);
  const unassignedManagers = unassignedTeams.reduce(
    (sum, team) => sum + (team.managerCount ?? 0),
    0,
  );

  return {
    id: leagueSeason.id,
    leagueId: leagueSeason.league.id,
    leagueName: leagueSeason.league.name,
    accountId: accountIdFallback,
    divisions,
    unassignedTeams,
    totalTeams: totalDivisionTeams + unassignedTeams.length,
    totalPlayers: totalDivisionPlayers + unassignedPlayers,
    totalManagers: totalDivisionManagers + unassignedManagers,
    unassignedTeamCount: unassignedTeams.length,
  } satisfies LeagueSeasonSummary;
};

export const mapLeagueSetup = (
  setup: LeagueSetupType,
  accountIdFallback: string,
): LeagueSetupSummary => {
  const season = setup.season
    ? {
        id: setup.season.id,
        name: setup.season.name,
        accountId: setup.season.accountId,
      }
    : null;

  const fallbackAccountId = season?.accountId ?? accountIdFallback;

  const leagueSeasons = (setup.leagueSeasons ?? []).map((leagueSeason) =>
    mapLeagueSeason(leagueSeason, fallbackAccountId),
  );

  return {
    season,
    leagueSeasons,
  };
};
