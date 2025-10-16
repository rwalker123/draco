import {
  aspnetusers,
  playerswantedclassified,
  Prisma,
  teamswantedclassified,
} from '@prisma/client';

export interface dbMonitoringConnectivityResult {
  connectivity_test: number;
}

export interface dbLeaderCategoryConfig {
  fieldname: string;
  isbatleader: boolean;
}

export interface dbPlayerTeamAssignment {
  playerId: bigint;
  teamId?: bigint | null;
  teamName?: string | null;
}

export type dbBattingStatisticsRow = {
  playerId: bigint;
  playerName: string;
  teams?: string[];
  teamName?: string;
  ab: number;
  h: number;
  r: number;
  d: number;
  t: number;
  hr: number;
  rbi: number;
  bb: number;
  so: number;
  hbp: number;
  sb: number;
  sf: number;
  sh: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  tb: number;
  pa: number;
  //[key: string]: string | number | bigint | string[] | undefined;
};

export type dbPitchingStatisticsRow = {
  playerId: bigint;
  playerName: string;
  teams?: string[];
  teamName?: string;
  ip: number;
  ip2: number;
  w: number;
  l: number;
  s: number;
  h: number;
  r: number;
  er: number;
  bb: number;
  so: number;
  hr: number;
  bf: number;
  wp: number;
  hbp: number;
  era: number;
  whip: number;
  k9: number;
  bb9: number;
  oba: number;
  slg: number;
  ipDecimal: number;
  //[key: string]: string | number | bigint | string[] | undefined;
};

export interface dbTeamSeasonValidationResult {
  id: bigint;
  teamid: bigint;
  name: string;
  leagueseasonid: bigint;
  divisionseasonid: bigint | null;
  leagueseason: {
    id: bigint;
    seasonid: bigint;
    leagueid: bigint;
    league: {
      id: bigint;
      name: string;
      accountid: bigint;
    };
    season?: {
      id: bigint;
      name: string;
    };
  };
  teams?: {
    id: bigint;
    webaddress: string | null;
    youtubeuserid: string | null;
    defaultvideo: string | null;
    autoplayvideo: boolean;
  };
  divisionseason?: {
    id: bigint;
    divisionid: bigint;
    divisiondefs: {
      id: bigint;
      name: string;
    };
  };
}

// db types used to map to the response schemas
export type dbLeague = Prisma.leagueGetPayload<{
  select: {
    id: true;
    name: true;
    accountid: true;
  };
}>;

export type dbLeagueCreateInput = Prisma.leagueUncheckedCreateInput;

export type dbLeagueUpdateInput = Prisma.leagueUncheckedUpdateInput;

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

export type dbContactEmailOnly = Prisma.contactsGetPayload<{
  select: {
    id: true;
    firstname: true;
    lastname: true;
    email: true;
  };
}>;

export type dbTeamSeason = Prisma.teamsseasonGetPayload<{
  select: { id: true; name: true };
}>;

export type dbRosterMember = Prisma.rosterseasonGetPayload<{
  include: { roster: { include: { contacts: true } } };
}>;

export type dbRosterSeasonContactReference = Prisma.rosterseasonGetPayload<{
  select: { roster: { select: { contactid: true } } };
}>;

export type dbAvailableField = Prisma.availablefieldsGetPayload<{
  select: {
    id: true;
    name: true;
    address: true;
    city: true;
    state: true;
    zipcode: true;
    shortname: true;
    comment: true;
    directions: true;
    rainoutnumber: true;
    latitude: true;
    longitude: true;
  };
}>;

export type dbGameInfo = Prisma.leaguescheduleGetPayload<{
  select: {
    id: true;
    gamedate: true;
    hteamid: true;
    vteamid: true;
    leagueid: true;
    fieldid: true;
    hscore: true;
    vscore: true;
    gamestatus: true;
    gametype: true;
    comment: true;
    umpire1: true;
    umpire2: true;
    umpire3: true;
    umpire4: true;
    availablefields: true;
    hometeam: { select: { id: true; name: true } };
    visitingteam: { select: { id: true; name: true } };
    leagueseason: { select: { id: true; league: { select: { name: true } } } };
    _count: { select: { gamerecap: true } };
  };
}>;

export type dbRosterSeason = Prisma.rosterseasonGetPayload<{
  include: { roster: { include: { contacts: true } } };
}>;

export type dbTeamManagerWithContact = Prisma.teamseasonmanagerGetPayload<{
  include: { contacts: true };
}>;

export type dbSeasonManagerWithRelations = Prisma.teamseasonmanagerGetPayload<{
  select: {
    id: true;
    contactid: true;
    contacts: {
      select: {
        id: true;
        firstname: true;
        lastname: true;
        email: true;
        phone1: true;
        phone2: true;
        phone3: true;
      };
    };
    teamsseason: {
      select: {
        id: true;
        name: true;
        leagueseasonid: true;
        leagueseason: {
          select: {
            id: true;
            league: {
              select: {
                name: true;
              };
            };
          };
        };
      };
    };
  };
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

export interface dbSeasonWithLeagues {
  id: bigint;
  name: string;
  accountid: bigint;
  leagueseason: Array<{
    id: bigint;
    leagueid: bigint;
    league: {
      id: bigint;
      name: string;
    };
    divisionseason?: Array<{
      id: bigint;
      priority: number | null;
      divisiondefs: {
        id: bigint;
        name: string;
      } | null;
    }>;
  }>;
}

export type dbLeagueSeasonBasic = Prisma.leagueseasonGetPayload<{
  select: {
    id: true;
    seasonid: true;
    leagueid: true;
    league: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

export type dbCurrentSeason = Prisma.currentseasonGetPayload<{
  select: {
    accountid: true;
    seasonid: true;
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

export type dbAspnetRole = Prisma.aspnetrolesGetPayload<{
  select: {
    id: true;
    name: true;
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

export type dbContactWithAccountRoles = Prisma.contactsGetPayload<{
  select: {
    id: true;
    firstname: true;
    lastname: true;
    email: true;
    middlename: true;
    userid: true;
    contactroles: {
      select: {
        id: true;
        roleid: true;
        roledata: true;
        accountid: true;
      };
    };
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

export type dbTeamSeasonWithTeam = Prisma.teamsseasonGetPayload<{
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
  };
}>;

export type dbUser = aspnetusers;

export type dbPasswordResetToken = Prisma.passwordresettokensGetPayload<{
  select: {
    id: true;
    userid: true;
    token: true;
    expiresat: true;
    used: true;
    createdat: true;
  };
}>;

export type dbPasswordResetTokenCreateInput = Prisma.passwordresettokensUncheckedCreateInput;

export type dbDivisionDefinition = Prisma.divisiondefsGetPayload<{
  select: {
    id: true;
    name: true;
    accountid: true;
  };
}>;

export type dbDivisionSeasonWithDefinition = Prisma.divisionseasonGetPayload<{
  include: {
    divisiondefs: {
      select: {
        id: true;
        name: true;
        accountid: true;
      };
    };
  };
}>;

export type dbDivisionSeasonWithTeams = Prisma.divisionseasonGetPayload<{
  include: {
    divisiondefs: {
      select: {
        id: true;
        name: true;
        accountid: true;
      };
    };
    teamsseason: {
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
      };
    };
  };
}>;

export type dbLeagueSeason = Prisma.leagueseasonGetPayload<{
  include: {
    league: true;
  };
}>;

export type dbLeagueSeasonRecord = Prisma.leagueseasonGetPayload<{
  select: {
    id: true;
    leagueid: true;
    seasonid: true;
  };
}>;

export type dbLeagueSeasonWithTeams = Prisma.leagueseasonGetPayload<{
  include: {
    league: {
      select: {
        id: true;
        name: true;
        accountid: true;
      };
    };
    season: {
      select: {
        id: true;
        name: true;
        accountid: true;
      };
    };
    divisionseason: {
      include: {
        divisiondefs: {
          select: {
            id: true;
            name: true;
            accountid: true;
          };
        };
        teamsseason: {
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
          };
        };
      };
    };
    teamsseason: {
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
      };
    };
  };
}>;

export type dbLeagueSeasonWithDivisionDetails = Prisma.leagueseasonGetPayload<{
  include: {
    league: {
      select: {
        id: true;
        name: true;
        accountid: true;
      };
    };
    divisionseason: {
      include: {
        divisiondefs: {
          select: {
            id: true;
            name: true;
            accountid: true;
          };
        };
        teamsseason: {
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
          };
        };
      };
    };
    teamsseason: {
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
      };
    };
  };
}>;

export type dbLeagueSeasonWithCounts = Prisma.leagueseasonGetPayload<{
  include: {
    league: {
      select: {
        id: true;
        name: true;
        accountid: true;
      };
    };
    _count: {
      select: {
        divisionseason: true;
        gameejections: true;
        golfmatch: true;
        leagueevents: true;
        leagueschedule: true;
        playoffsetup: true;
        teamsseason: true;
      };
    };
  };
}>;

export interface dbTeamSeasonCountResult {
  teamseasonid: bigint;
  count: number;
}

export type dbScheduleGameWithDetails = Prisma.leaguescheduleGetPayload<{
  include: {
    availablefields: true;
    leagueseason: {
      include: {
        league: true;
        season: true;
      };
    };
  };
}>;

export type dbScheduleGameWithRecaps = Prisma.leaguescheduleGetPayload<{
  include: {
    availablefields: true;
    leagueseason: {
      include: {
        league: true;
        season: true;
      };
    };
    gamerecap: {
      select: {
        teamid: true;
        recap: true;
      };
    };
  };
}>;

export type dbScheduleGameForAccount = Prisma.leaguescheduleGetPayload<{
  include: {
    leagueseason: {
      include: {
        league: true;
        season: true;
      };
    };
  };
}>;

export type dbGameRecap = Prisma.gamerecapGetPayload<{
  select: {
    gameid: true;
    teamid: true;
    recap: true;
  };
}>;

export type dbScheduleCreateData = Pick<
  Prisma.leaguescheduleUncheckedCreateInput,
  | 'gamedate'
  | 'hteamid'
  | 'vteamid'
  | 'hscore'
  | 'vscore'
  | 'comment'
  | 'fieldid'
  | 'leagueid'
  | 'gamestatus'
  | 'gametype'
  | 'umpire1'
  | 'umpire2'
  | 'umpire3'
  | 'umpire4'
>;

export type dbScheduleUpdateData = Pick<
  Prisma.leaguescheduleUncheckedUpdateInput,
  | 'gamedate'
  | 'hteamid'
  | 'vteamid'
  | 'comment'
  | 'fieldid'
  | 'gamestatus'
  | 'gametype'
  | 'umpire1'
  | 'umpire2'
  | 'umpire3'
  | 'umpire4'
>;

export type dbScheduleResultUpdateData = Pick<
  Prisma.leaguescheduleUncheckedUpdateInput,
  'hscore' | 'vscore' | 'gamestatus'
>;

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

export type dbEmailTemplate = Prisma.email_templatesGetPayload<{
  select: {
    id: true;
    account_id: true;
    name: true;
    description: true;
    subject_template: true;
    body_template: true;
    created_by_user_id: true;
    created_at: true;
    updated_at: true;
    is_active: true;
  };
}>;

export type dbCreateEmailTemplateInput = {
  account_id: bigint;
  name: string;
  description: string;
  subject_template: string;
  body_template: string;
  created_by_user_id: string;
  is_active: boolean;
};

export type dbUpdateEmailTemplateData = {
  name?: string;
  description?: string;
  subject_template?: string;
  body_template?: string;
  is_active?: boolean;
  updated_at?: Date;
};

export type dbEmail = Prisma.emailsGetPayload<{
  select: {
    id: true;
    account_id: true;
    created_by_user_id: true;
    subject: true;
    body_html: true;
    body_text: true;
    template_id: true;
    status: true;
    scheduled_send_at: true;
    created_at: true;
    sent_at: true;
    total_recipients: true;
    successful_deliveries: true;
    failed_deliveries: true;
    bounce_count: true;
    open_count: true;
    click_count: true;
  };
}>;

export type dbEmailWithAccount = Prisma.emailsGetPayload<{
  include: {
    accounts: true;
  };
}>;

export type dbEmailDetails = Prisma.emailsGetPayload<{
  include: {
    created_by: {
      select: {
        username: true;
      };
    };
    template: true;
    recipients: {
      include: {
        contact: {
          select: {
            firstname: true;
            lastname: true;
          };
        };
      };
    };
    attachments: true;
  };
}>;

export type dbEmailSummary = Prisma.emailsGetPayload<{
  select: {
    id: true;
    subject: true;
    status: true;
    created_at: true;
    sent_at: true;
    total_recipients: true;
    successful_deliveries: true;
    failed_deliveries: true;
    open_count: true;
    click_count: true;
    created_by: {
      select: {
        username: true;
      };
    };
    template: {
      select: {
        name: true;
      };
    };
  };
}>;

export type dbEmailRecipient = Prisma.email_recipientsGetPayload<{
  select: {
    id: true;
    email_id: true;
    contact_id: true;
    email_address: true;
    contact_name: true;
    recipient_type: true;
    status: true;
    sent_at: true;
    delivered_at: true;
    opened_at: true;
    clicked_at: true;
    bounce_reason: true;
    error_message: true;
  };
}>;

export type dbScheduledEmail = Prisma.emailsGetPayload<{
  select: {
    id: true;
    account_id: true;
    subject: true;
    body_html: true;
    status: true;
    scheduled_send_at: true;
  };
}>;

export type dbWorkoutWithField = Prisma.workoutannouncementGetPayload<{
  include: {
    availablefields: {
      select: {
        id: true;
        name: true;
        address: true;
      };
    };
  };
}>;

export type dbWorkoutWithRegistrationCount = Prisma.workoutannouncementGetPayload<{
  include: {
    availablefields: {
      select: {
        id: true;
        name: true;
        address: true;
      };
    };
    _count: {
      select: {
        workoutregistration: true;
      };
    };
  };
}>;

export type dbWorkoutRegistration = Prisma.workoutregistrationGetPayload<{
  select: {
    id: true;
    workoutid: true;
    name: true;
    email: true;
    age: true;
    phone1: true;
    phone2: true;
    phone3: true;
    phone4: true;
    positions: true;
    ismanager: true;
    whereheard: true;
    dateregistered: true;
  };
}>;

export type dbWorkoutCreateData = Pick<
  Prisma.workoutannouncementUncheckedCreateInput,
  'workoutdesc' | 'workoutdate' | 'fieldid' | 'comments'
>;

export type dbWorkoutUpdateData = Pick<
  Prisma.workoutannouncementUncheckedUpdateInput,
  'workoutdesc' | 'workoutdate' | 'fieldid' | 'comments'
>;

export type dbWorkoutRegistrationUpsertData = Pick<
  Prisma.workoutregistrationUncheckedCreateInput,
  | 'name'
  | 'email'
  | 'age'
  | 'phone1'
  | 'phone2'
  | 'phone3'
  | 'phone4'
  | 'positions'
  | 'ismanager'
  | 'whereheard'
>;

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

export type dbTeamWithLeague = Prisma.teamsseasonGetPayload<{
  include: {
    teams: true;
    leagueseason: {
      include: {
        league: true;
      };
    };
  };
}>;

export type dbTeam = Prisma.teamsseasonGetPayload<{
  include: {
    teams: true;
  };
}>;

// Email repository DTOs
export type dbCreateEmailInput = {
  account_id: bigint;
  created_by_user_id: string;
  subject: string;
  body_html: string;
  body_text: string;
  template_id?: bigint | null;
  status: string;
  scheduled_send_at?: Date | null;
  created_at: Date;
};

export type dbCreateEmailRecipientInput = {
  email_id: bigint;
  contact_id: bigint;
  email_address: string;
  contact_name: string;
  recipient_type: string;
};

export type dbEmailUpdateData = {
  status?: string;
  total_recipients?: number;
  sent_at?: Date | null;
  successful_deliveries?: number;
  failed_deliveries?: number;
  bounce_count?: number;
  open_count?: number;
  click_count?: number;
};

export type dbEmailListOptions = {
  skip: number;
  take: number;
  status?: string;
};

export type dbEmailRecipientUpdateData = {
  status?: string;
  sent_at?: Date | null;
  delivered_at?: Date | null;
  opened_at?: Date | null;
  clicked_at?: Date | null;
  bounce_reason?: string | null;
  error_message?: string | null;
};

export type dbEmailRecipientBulkUpdateData = {
  status: string;
  error_message?: string | null;
  sent_at?: Date | null;
};

export type dbRecipientStatusCount = {
  status: string;
  count: number;
};

export type dbEmailAttachment = Prisma.email_attachmentsGetPayload<{
  select: {
    id: true;
    email_id: true;
    filename: true;
    original_name: true;
    file_size: true;
    mime_type: true;
    uploaded_at: true;
    storage_path: true;
  };
}>;

export type dbEmailAttachmentWithEmail = Prisma.email_attachmentsGetPayload<{
  include: {
    email: true;
  };
}>;

export type dbAttachmentForSending = Prisma.email_attachmentsGetPayload<{
  select: {
    id: true;
    email_id: true;
    filename: true;
    original_name: true;
    file_size: true;
    mime_type: true;
    storage_path: true;
    email: {
      select: {
        account_id: true;
      };
    };
  };
}>;

export type dbCreateEmailAttachmentInput = {
  email_id: bigint;
  filename: string;
  original_name: string;
  file_size: bigint;
  mime_type: string | null;
  storage_path: string;
};

export type dbPhotoSubmission = Prisma.photogallerysubmissionGetPayload<{
  select: {
    id: true;
    accountid: true;
    teamid: true;
    albumid: true;
    submittercontactid: true;
    moderatedbycontactid: true;
    approvedphotoid: true;
    title: true;
    caption: true;
    originalfilename: true;
    originalfilepath: true;
    primaryimagepath: true;
    thumbnailimagepath: true;
    status: true;
    denialreason: true;
    submittedat: true;
    updatedat: true;
    moderatedat: true;
  };
}>;

export type dbPhotoSubmissionWithRelations = Prisma.photogallerysubmissionGetPayload<{
  include: {
    accounts: {
      select: {
        id: true;
        name: true;
      };
    };
    photogalleryalbum: {
      select: {
        id: true;
        title: true;
        teamid: true;
      };
    };
    photogallery: {
      select: {
        id: true;
        title: true;
        albumid: true;
      };
    };
    submitter: {
      select: {
        id: true;
        firstname: true;
        lastname: true;
        email: true;
      };
    };
    moderator: {
      select: {
        id: true;
        firstname: true;
        lastname: true;
        email: true;
      };
    };
  };
}>;

export type dbTeamSeasonRecord = {
  wins: number;
  losses: number;
  ties: number;
};
