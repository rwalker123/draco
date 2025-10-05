import type {
  LeagueSetupType,
  LeagueSeasonWithDivisionTeamsAndUnassignedType,
  DivisionSeasonWithTeamsType,
} from '@draco/shared-schemas';

const mapDivision = (division: DivisionSeasonWithTeamsType) => {
  const teams = division.teams ?? [];

  division.teamCount = teams.length;
  division.totalPlayers = teams.reduce((sum, team) => sum + (team.playerCount ?? 0), 0);
  division.totalManagers = teams.reduce((sum, team) => sum + (team.managerCount ?? 0), 0);

  return division;
};

const mapLeagueSeason = (
  leagueSeason: LeagueSeasonWithDivisionTeamsAndUnassignedType,
): LeagueSeasonWithDivisionTeamsAndUnassignedType => {
  const divisions = (leagueSeason.divisions ?? []).map(mapDivision);
  const unassignedTeams = leagueSeason.unassignedTeams ?? [];

  const totalDivisionTeams = divisions.reduce(
    (sum, division) => sum + (division.teamCount || 0),
    0,
  );
  const totalDivisionPlayers = divisions.reduce(
    (sum, division) => sum + (division.totalPlayers || 0),
    0,
  );
  const totalDivisionManagers = divisions.reduce(
    (sum, division) => sum + (division.totalManagers || 0),
    0,
  );

  const unassignedPlayers = unassignedTeams.reduce((sum, team) => sum + (team.playerCount ?? 0), 0);
  const unassignedManagers = unassignedTeams.reduce(
    (sum, team) => sum + (team.managerCount ?? 0),
    0,
  );

  leagueSeason.totalTeams = totalDivisionTeams + unassignedTeams.length;
  leagueSeason.totalPlayers = totalDivisionPlayers + unassignedPlayers;
  leagueSeason.totalManagers = totalDivisionManagers + unassignedManagers;
  leagueSeason.unassignedTeamCount = unassignedTeams.length;

  return leagueSeason;
};

export const mapLeagueSetup = (setup: LeagueSetupType): LeagueSetupType => {
  setup.leagueSeasons = (setup.leagueSeasons ?? []).map((leagueSeason) =>
    mapLeagueSeason(leagueSeason),
  );

  return setup;
};
