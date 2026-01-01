import { golfroster, golfer, golfleaguesub, contacts } from '#prisma/client';

export type GolferWithContact = golfer & {
  contact: contacts;
};

export type GolfRosterWithGolfer = golfroster & {
  golfer: GolferWithContact;
};

export type GolfLeagueSubWithGolfer = golfleaguesub & {
  golfer: GolferWithContact;
};

export type AvailableContact = contacts & {
  golfer: {
    id: bigint;
    rosters: Array<{ id: bigint; teamseasonid: bigint }>;
    leaguesubs: Array<{ id: bigint; seasonid: bigint }>;
  } | null;
};

export interface IGolfRosterRepository {
  findByTeamSeasonId(teamSeasonId: bigint): Promise<GolfRosterWithGolfer[]>;
  findById(rosterId: bigint): Promise<GolfRosterWithGolfer | null>;
  findByIds(rosterIds: bigint[]): Promise<GolfRosterWithGolfer[]>;
  findByGolferAndTeam(golferId: bigint, teamSeasonId: bigint): Promise<golfroster | null>;
  findSubstitutesForSeason(seasonId: bigint): Promise<GolfLeagueSubWithGolfer[]>;
  findGolferByContactId(contactId: bigint): Promise<golfer | null>;
  findOrCreateGolfer(contactId: bigint, initialDifferential?: number | null): Promise<golfer>;
  createRosterEntry(data: {
    golferid: bigint;
    teamseasonid: bigint;
    isactive: boolean;
  }): Promise<golfroster>;
  createLeagueSub(data: {
    golferid: bigint;
    seasonid: bigint;
    isactive: boolean;
  }): Promise<golfleaguesub>;
  updateRosterEntry(
    rosterId: bigint,
    data: Partial<{
      isactive: boolean;
    }>,
  ): Promise<golfroster>;
  updateGolfer(
    golferId: bigint,
    data: Partial<{
      initialdifferential: number | null;
    }>,
  ): Promise<golfer>;
  updateLeagueSub(
    subId: bigint,
    data: Partial<{
      isactive: boolean;
    }>,
  ): Promise<golfleaguesub>;
  deleteRosterEntry(rosterId: bigint): Promise<golfroster>;
  deleteLeagueSub(subId: bigint): Promise<golfleaguesub>;
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
  hasMatchScores(golferId: bigint): Promise<boolean>;
  findLeagueSubById(subId: bigint): Promise<GolfLeagueSubWithGolfer | null>;
  findLeagueSubByGolferAndSeason(golferId: bigint, seasonId: bigint): Promise<golfleaguesub | null>;
}
