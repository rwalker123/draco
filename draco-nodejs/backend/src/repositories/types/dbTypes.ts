import { Prisma } from '@prisma/client';

// db types used to map to the response schemas
export type dbBaseContact = Prisma.contactsGetPayload<{
  select: {
    id: true;
    firstname: true;
    lastname: true;
    email: true;
    phone1: true;
    phone2: true;
    phone3: true;
    streetaddress: true;
    city: true;
    state: true;
    zip: true;
    dateofbirth: true;
    middlename: true;
    creatoraccountid: true;
    userid: true;
  };
}>;

export type dbTeamSeason = Prisma.teamsseasonGetPayload<{
  select: { id: true; name: true };
}>;

export type dbRosterMember = Prisma.rosterseasonGetPayload<{
  include: { roster: { include: { contacts: true } } };
}>;

export type dbRosterSeason = Prisma.rosterseasonGetPayload<{
  include: { roster: { include: { contacts: true } } };
}>;

export type dbTeamManagerWithContact = Prisma.teamseasonmanagerGetPayload<{
  include: { contacts: true };
}>;

export type dbRosterPlayer = Prisma.rosterGetPayload<{
  include: { contacts: true };
}>;

export type dbSeason = Prisma.seasonGetPayload<{
  select: {
    id: true;
    name: true;
    accountid: true;
  };
}>;

export type dbContactRoles = Prisma.contactrolesGetPayload<{
  select: {
    id: true;
    contactid: true;
    roleid: true;
    roledata: true;
    accountid: true;
  };
}>;

export type dbGlobalRoles = Prisma.aspnetuserrolesGetPayload<{
  select: {
    roleid: true;
  };
}>;

export type dbAspnetRolesId = Prisma.aspnetrolesGetPayload<{
  select: {
    id: true;
  };
}>;

export type dbAspnetRoleName = Prisma.aspnetrolesGetPayload<{
  select: {
    name: true;
  };
}>;

export type dbTeamSeasonWithLeague = Prisma.teamsseasonGetPayload<{
  select: {
    id: true;
    name: true;
    leagueseason: {
      include: {
        league: true;
        divisionseason: true;
      };
    };
  };
}>;

export type dbLeagueSeason = Prisma.leagueseasonGetPayload<{
  include: {
    league: true;
  };
}>;

// Type for raw SQL query result from getContactsWithRoles
export type dbContactWithRole = {
  id: bigint;
  firstname: string;
  lastname: string;
  email: string | null;
  userid: string | null;
  role_context_name: string | null;
  contactrole_id: bigint | null;
  roleid: string | null;
  roledata: bigint | null;
};

// Extended type for raw SQL query result with contact details
export type dbContactWithRoleAndDetails = dbContactWithRole & {
  phone1: string | null;
  phone2: string | null;
  phone3: string | null;
  streetaddress: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  dateofbirth: Date | null;
  middlename: string | null;
};

// Interface for raw account owner query result from getAutomaticRoleHolders
export type dbAccountOwner = {
  id: bigint;
  firstname: string;
  lastname: string;
  email: string | null;
  userid: string | null;
};

export type dbTeamSeasonManagerContact = Prisma.teamseasonmanagerGetPayload<{
  include: {
    contacts: {
      select: {
        id: true;
        firstname: true;
        lastname: true;
        email: true;
      };
    };
    teamsseason: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

export type dbAuthResponse = {
  token?: string;
  user?: {
    id: string;
    username: string;
  };
};

export type dbAccount = Prisma.accountsGetPayload<{
  include: {
    accounttypes: true;
    accountsurl: true;
  };
}>;

export type dbAccountAffiliation = Prisma.affiliationsGetPayload<{
  select: {
    id: true;
    name: true;
    url: true;
  };
}>;
