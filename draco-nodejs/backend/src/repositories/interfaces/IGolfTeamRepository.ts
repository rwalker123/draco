import { teamsseason, teams, divisionseason, golfer, contacts } from '#prisma/client';

export type GolfTeamWithFlight = teamsseason & {
  divisionseason:
    | (divisionseason & {
        divisiondefs: {
          id: bigint;
          name: string;
        };
      })
    | null;
  teams: teams;
  _count: {
    golfroster: number;
  };
};

export type GolfTeamWithRoster = teamsseason & {
  divisionseason:
    | (divisionseason & {
        divisiondefs: {
          id: bigint;
          name: string;
        };
      })
    | null;
  teams: teams;
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
  findByLeagueSeasonId(leagueSeasonId: bigint): Promise<GolfTeamWithFlight[]>;
  findByFlightId(flightId: bigint): Promise<GolfTeamWithFlight[]>;
  findById(teamSeasonId: bigint): Promise<GolfTeamWithFlight | null>;
  findByIdWithRoster(teamSeasonId: bigint): Promise<GolfTeamWithRoster | null>;
  create(leagueSeasonId: bigint, name: string, flightId?: bigint): Promise<teamsseason>;
  update(
    teamSeasonId: bigint,
    data: { name?: string; divisionseasonid?: bigint | null },
  ): Promise<teamsseason>;
  delete(teamSeasonId: bigint): Promise<teamsseason>;
  assignToFlight(teamSeasonId: bigint, flightId: bigint | null): Promise<teamsseason>;
  hasMatches(teamSeasonId: bigint): Promise<boolean>;
}
