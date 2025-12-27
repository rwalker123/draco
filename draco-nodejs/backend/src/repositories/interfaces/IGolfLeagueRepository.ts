import { golfleaguesetup, contacts } from '#prisma/client';

export type GolfLeagueSetupWithOfficers = golfleaguesetup & {
  contacts_golfleaguesetup_presidentidTocontacts: contacts | null;
  contacts_golfleaguesetup_vicepresidentidTocontacts: contacts | null;
  contacts_golfleaguesetup_secretaryidTocontacts: contacts | null;
  contacts_golfleaguesetup_treasureridTocontacts: contacts | null;
};

export type GolfAccountInfo = {
  id: bigint;
  name: string;
  accountTypeName: string;
  hasGolfSetup: boolean;
};

export interface IGolfLeagueRepository {
  findByAccountId(accountId: bigint): Promise<GolfLeagueSetupWithOfficers | null>;
  create(data: Partial<golfleaguesetup>): Promise<golfleaguesetup>;
  update(accountId: bigint, data: Partial<golfleaguesetup>): Promise<golfleaguesetup>;
  getGolfAccounts(): Promise<GolfAccountInfo[]>;
}
