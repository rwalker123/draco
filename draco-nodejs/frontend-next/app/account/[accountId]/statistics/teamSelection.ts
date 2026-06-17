import type { RosterSeasonMembershipListType, TeamSeasonType } from '@draco/shared-schemas';
import type { Team } from '@/types/schedule';

export interface MyTeamMatch {
  isAllTime: boolean;
  overallTeamIds: Set<string>;
  seasonTeamIds: Set<string>;
}

export const buildOverallTeamIdSet = (userTeams: TeamSeasonType[]): Set<string> =>
  new Set(userTeams.map((team) => team.team?.id).filter((id): id is string => Boolean(id)));

export const buildSeasonMembershipIdSet = (
  memberships: RosterSeasonMembershipListType,
): Set<string> => new Set(memberships.map((membership) => membership.teamSeasonId));

export const isMyTeam = (team: Team, match: MyTeamMatch): boolean =>
  match.isAllTime
    ? Boolean(team.overallTeamId && match.overallTeamIds.has(team.overallTeamId))
    : Boolean(team.teamId && match.seasonTeamIds.has(team.teamId));

export const pickDefaultTeam = (teams: Team[], match: MyTeamMatch): Team | undefined => {
  if (teams.length === 0) return undefined;
  return teams.find((team) => isMyTeam(team, match)) ?? teams[0];
};

export const partitionMyTeams = (
  teams: Team[],
  match: MyTeamMatch,
): { myTeams: Team[]; otherTeams: Team[] } => {
  const myTeams: Team[] = [];
  const otherTeams: Team[] = [];
  for (const team of teams) {
    if (isMyTeam(team, match)) {
      myTeams.push(team);
    } else {
      otherTeams.push(team);
    }
  }
  return { myTeams, otherTeams };
};
