import { playerswantedclassified, Prisma, teamswantedclassified } from '@prisma/client';

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

export type dbAvailableField = Prisma.availablefieldsGetPayload<{
  select: {
    id: true;
    name: true;
    address: true;
    accountid: true;
  };
}>;

export type dbRosterSeason = Prisma.rosterseasonGetPayload<{
  include: { roster: { include: { contacts: true } } };
}>;

export type dbTeamManagerWithContact = Prisma.teamseasonmanagerGetPayload<{
  include: { contacts: true };
}>;

export type dbLeagueUmpireWithContact = Prisma.leagueumpiresGetPayload<{
  include: {
    contacts: {
      select: {
        id: true;
        firstname: true;
        lastname: true;
        email: true;
      };
    };
  };
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

export type dbTeamSeasonLeague = Prisma.teamsseasonGetPayload<{
  include: {
    leagueseason: {
      include: {
        league: {
          select: {
            id: true;
            name: true;
          };
        };
      };
    };
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

export type dbTeamSeasonWithLeaguesAndTeams = Prisma.teamsseasonGetPayload<{
  include: {
    teams: true;
    leagueseason: {
      include: {
        league: true;
        season: true;
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

export type dbAccountUrl = Prisma.accountsurlGetPayload<{
  select: {
    id: true;
    accountid: true;
    url: true;
  };
}>;

export type dbAccountTypeRecord = Prisma.accounttypesGetPayload<{
  select: {
    id: true;
    name: true;
    filepath: true;
  };
}>;

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

export type dbTeamsWanted = Prisma.teamswantedclassifiedGetPayload<{
  select: {
    id: true;
    accountid: true;
    datecreated: true;
    name: true;
    email: true;
    phone: true;
    experience: true;
    positionsplayed: true;
    birthdate: true;
  };
}>;

export type dbTeamsWantedPublic = Prisma.teamswantedclassifiedGetPayload<{
  select: {
    id: true;
    datecreated: true;
    name: true;
    experience: true;
    positionsplayed: true;
    birthdate: true;
    accounts: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

export type dbPlayersWanted = Prisma.playerswantedclassifiedGetPayload<{
  select: {
    id: true;
    accountid: true;
    datecreated: true;
    createdbycontactid: true;
    teameventname: true;
    description: true;
    positionsneeded: true;
  };
}>;

export type dbPlayersWantedWithRelations = Prisma.playerswantedclassifiedGetPayload<{
  include: {
    contacts: { select: { id: true; firstname: true; lastname: true } };
    accounts: { select: { id: true; name: true } };
  };
}>;

// Search parameters for classifieds
export type dbClassifiedSearchParams = {
  // Pagination
  page?: number;
  limit?: number;

  // Sorting
  sortBy?: 'dateCreated' | 'relevance';
  sortOrder?: 'asc' | 'desc';

  // Type filtering
  type?: 'players' | 'teams' | 'all';

  // Content filtering
  searchQuery?: string;
  positions?: string[];
  experience?: string[];

  // Date filtering
  dateFrom?: Date;
  dateTo?: Date;
};

// Search filters applied to results
export type dbClassifiedSearchFilters = {
  type: 'players' | 'teams' | 'all';
  positions: string[];
  experience: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  searchQuery: string | null;
};

// Search result with relevance scoring
export type dbClassifiedSearchResult = {
  classified: playerswantedclassified | teamswantedclassified;
  relevanceScore: number;
  matchReasons: string[];
};

// Base response for classified listings
export type dbClassifiedPageResponse<T> = {
  data: T[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
    totalPages: number;
  };
  filters: dbClassifiedSearchFilters;
};

export type dbContactInfo = {
  email: string | null;
  phone: string | null;
  birthDate: string | null;
};
export type dbSponsor = Prisma.sponsorsGetPayload<{
  select: {
    id: true;
    accountid: true;
    teamid: true;
    name: true;
    streetaddress: true;
    citystatezip: true;
    description: true;
    email: true;
    phone: true;
    fax: true;
    website: true;
  };
}>;

export type dbPollOptionWithCount = Prisma.voteoptionsGetPayload<{
  include: {
    _count: {
      select: {
        voteanswers: true;
      };
    };
  };
}>;

export type dbPollQuestionWithCounts = Prisma.votequestionGetPayload<{
  include: {
    voteoptions: {
      include: {
        _count: {
          select: {
            voteanswers: true;
          };
        };
      };
    };
  };
}>;

export type dbPollQuestionWithUserVotes = Prisma.votequestionGetPayload<{
  include: {
    voteoptions: {
      include: {
        _count: {
          select: {
            voteanswers: true;
          };
        };
      };
    };
    voteanswers: {
      select: {
        optionid: true;
        contactid: true;
      };
    };
  };
}>;

export type dbPollOptionUpsertData = {
  id?: bigint;
  optiontext: string;
  priority?: number;
};

export type dbPollCreateData = {
  question: string;
  active: boolean;
  options: Array<Omit<dbPollOptionUpsertData, 'id'>>;
};

export type dbPollUpdateData = {
  question?: string;
  active?: boolean;
  options?: dbPollOptionUpsertData[];
  deletedOptionIds?: bigint[];
};

export type dbUserTeams = Prisma.rosterseasonGetPayload<{
  include: {
    teamsseason: {
      include: {
        leagueseason: {
          include: {
            league: {
              select: {
                name: true;
              };
            };
          };
        };
        teams: {
          select: {
            id: true;
            accountid: true;
          };
        };
      };
    };
  };
}>;

export type dbUserManagerTeams = Prisma.teamseasonmanagerGetPayload<{
  include: {
    teamsseason: {
      include: {
        leagueseason: {
          include: {
            league: {
              select: {
                name: true;
              };
            };
          };
        };
        teams: {
          select: {
            id: true;
            accountid: true;
          };
        };
      };
    };
  };
}>;

export type dbTeamsWithLeaguesAndDivisions = Prisma.teamsseasonGetPayload<{
  include: {
    teams: {
      select: {
        id: true;
        webaddress: true;
        youtubeuserid: true;
        defaultvideo: true;
        autoplayvideo: true;
      };
    };
    leagueseason: {
      include: {
        league: {
          select: {
            id: true;
            name: true;
          };
        };
      };
    };
    divisionseason: {
      include: {
        divisiondefs: {
          select: {
            id: true;
            name: true;
          };
        };
      };
    };
  };
}>;

export type dbTeam = Prisma.teamsseasonGetPayload<{
  include: {
    teams: true;
    leagueseason: {
      include: {
        league: true;
      };
    };
  };
}>;
