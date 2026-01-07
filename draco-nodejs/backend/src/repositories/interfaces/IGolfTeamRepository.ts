import { teamsseason, teams, league, golfer, contacts } from '#prisma/client';

export type GolfTeamWithFlight = teamsseason & {
  teams: teams;
  leagueseason: {
    id: bigint;
    league: league;
  };
  _count: {
    golfroster: number;
  };
};

export type GolfTeamWithRoster = teamsseason & {
  teams: teams;
  leagueseason: {
    id: bigint;
    league: league;
  };
  golfroster: Array<{
    id: bigint;
    golferid: bigint;
    teamseasonid: bigint;
    isactive: boolean;
    golfer: golfer & {
      contact: contacts;
    };
  }>;
};

export interface IGolfTeamRepository {
  findBySeasonId(seasonId: bigint): Promise<GolfTeamWithFlight[]>;
  findByFlightId(flightId: bigint): Promise<GolfTeamWithFlight[]>;
  findById(teamSeasonId: bigint): Promise<GolfTeamWithFlight | null>;
  findByIdWithRoster(teamSeasonId: bigint): Promise<GolfTeamWithRoster | null>;
  create(flightId: bigint, name: string): Promise<teamsseason>;
  update(teamSeasonId: bigint, data: { name?: string }): Promise<teamsseason>;
  delete(teamSeasonId: bigint): Promise<teamsseason>;
  hasMatches(teamSeasonId: bigint): Promise<boolean>;
  hasRosterEntries(teamSeasonId: bigint): Promise<boolean>;
}
