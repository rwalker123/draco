import type { GameType, TeamSeasonType } from '@draco/shared-schemas';

export type UpcomingGame = Pick<
  GameType,
  'id' | 'gameDate' | 'homeTeam' | 'visitorTeam' | 'field' | 'league' | 'season' | 'gameStatus' | 'gameStatusText'
> & {
  startsAt: string;
};

export type TeamSummary = Pick<TeamSeasonType, 'id' | 'name' | 'league' | 'division'>;

export type ScorekeeperScope = 'account' | 'league' | 'team';

export type ScorekeeperAssignment = {
  id: string;
  scope: ScorekeeperScope;
  accountId: string;
  leagueId?: string | null;
  teamId?: string | null;
  teamSeasonId?: string | null;
  updatedAt?: string;
};

export type ScheduleSnapshot = {
  games: UpcomingGame[];
  teams: TeamSummary[];
  assignments: ScorekeeperAssignment[];
  seasonId?: string | null;
};
