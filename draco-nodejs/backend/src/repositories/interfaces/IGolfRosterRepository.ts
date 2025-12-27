import { golfroster, contacts } from '#prisma/client';

export type GolfRosterWithContact = golfroster & {
  contacts: contacts;
};

export type GolfSubstituteEntry = golfroster & {
  contacts: contacts;
  teamsseason: {
    id: bigint;
    name: string;
    divisionseasonid: bigint | null;
  };
};

export type AvailableContact = contacts & {
  golfroster: Array<{ id: bigint; teamseasonid: bigint }>;
};

export interface IGolfRosterRepository {
  findByTeamSeasonId(teamSeasonId: bigint): Promise<GolfRosterWithContact[]>;
  findById(rosterId: bigint): Promise<GolfRosterWithContact | null>;
  findByContactAndTeam(contactId: bigint, teamSeasonId: bigint): Promise<golfroster | null>;
  findSubstitutesForSeason(seasonId: bigint): Promise<GolfSubstituteEntry[]>;
  findSubstitutesForFlight(flightId: bigint): Promise<GolfSubstituteEntry[]>;
  create(data: {
    contactid: bigint;
    teamseasonid: bigint;
    isactive: boolean;
    issub: boolean;
    initialdifferential?: number | null;
    subseasonid?: bigint | null;
  }): Promise<golfroster>;
  update(
    rosterId: bigint,
    data: Partial<{
      isactive: boolean;
      issub: boolean;
      initialdifferential: number | null;
      subseasonid: bigint | null;
    }>,
  ): Promise<golfroster>;
  delete(rosterId: bigint): Promise<golfroster>;
  releasePlayer(rosterId: bigint, releaseAsSub: boolean, seasonId: bigint): Promise<golfroster>;
  findAvailableContacts(accountId: bigint, seasonId: bigint): Promise<AvailableContact[]>;
  contactExistsInAccount(contactId: bigint, accountId: bigint): Promise<boolean>;
  createContact(
    accountId: bigint,
    data: {
      firstname: string;
      lastname: string;
      middlename?: string | null;
      email?: string | null;
    },
  ): Promise<contacts>;
  hasScores(rosterId: bigint): Promise<boolean>;
}
