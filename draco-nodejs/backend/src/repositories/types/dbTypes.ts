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
