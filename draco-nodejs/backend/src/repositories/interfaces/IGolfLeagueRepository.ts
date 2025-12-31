import { golfleaguesetup, contacts, leagueseason, golfseasonconfig } from '#prisma/client';

export type GolfLeagueSetupWithOfficers = golfleaguesetup & {
  contacts_golfleaguesetup_presidentidTocontacts: contacts | null;
  contacts_golfleaguesetup_vicepresidentidTocontacts: contacts | null;
  contacts_golfleaguesetup_secretaryidTocontacts: contacts | null;
  contacts_golfleaguesetup_treasureridTocontacts: contacts | null;
  leagueseason: (leagueseason & { golfseasonconfig: golfseasonconfig | null }) | null;
};

export type GolfAccountInfo = {
  id: bigint;
  name: string;
  accountTypeName: string;
  hasGolfSetup: boolean;
};

export interface IGolfLeagueRepository {
  findByLeagueSeasonId(leagueSeasonId: bigint): Promise<GolfLeagueSetupWithOfficers | null>;
  getLeagueSeasonId(accountId: bigint, seasonId: bigint): Promise<bigint | null>;
  create(data: Partial<golfleaguesetup>): Promise<golfleaguesetup>;
  update(leagueSeasonId: bigint, data: Partial<golfleaguesetup>): Promise<golfleaguesetup>;
  getGolfAccounts(): Promise<GolfAccountInfo[]>;
  upsertSeasonConfig(leagueSeasonId: bigint, teamSize: number): Promise<golfseasonconfig>;
}
