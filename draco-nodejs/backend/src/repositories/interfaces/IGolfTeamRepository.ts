import { teamsseason, teams, divisionseason, contacts } from '#prisma/client';

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
    contactid: bigint;
    teamseasonid: bigint;
    isactive: boolean;
    issub: boolean;
    initialdifferential: number | null;
    subseasonid: bigint | null;
    contacts: contacts;
  }>;
};

export interface IGolfTeamRepository {
  findBySeasonId(seasonId: bigint): Promise<GolfTeamWithFlight[]>;
  findByFlightId(flightId: bigint): Promise<GolfTeamWithFlight[]>;
  findById(teamSeasonId: bigint): Promise<GolfTeamWithFlight | null>;
  findByIdWithRoster(teamSeasonId: bigint): Promise<GolfTeamWithRoster | null>;
  create(
    seasonId: bigint,
    accountId: bigint,
    name: string,
    flightId?: bigint,
  ): Promise<teamsseason>;
  update(
    teamSeasonId: bigint,
    data: { name?: string; divisionseasonid?: bigint | null },
  ): Promise<teamsseason>;
  delete(teamSeasonId: bigint): Promise<teamsseason>;
  assignToFlight(teamSeasonId: bigint, flightId: bigint | null): Promise<teamsseason>;
  findOrCreateTeamDef(accountId: bigint): Promise<teams>;
  teamSeasonExists(teamSeasonId: bigint, seasonId: bigint): Promise<boolean>;
  hasMatches(teamSeasonId: bigint): Promise<boolean>;
}
