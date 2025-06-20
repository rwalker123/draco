-- Table: aspnetusers
-- This table is used for ASP.NET Identity users
CREATE TABLE aspnetusers (
    id varchar(128) NOT NULL PRIMARY KEY,
    email varchar(256) NULL,
    emailconfirmed boolean NOT NULL,
    passwordhash text NULL,
    securitystamp text NULL,
    phonenumber varchar(30) NULL,
    phonenumberconfirmed boolean NOT NULL,
    twofactorenabled boolean NOT NULL,
    lockoutenddateutc timestamp with time zone NULL,
    lockoutenabled boolean NOT NULL,
    accessfailedcount int NOT NULL,
    username varchar(256) NULL
);

-- Table: AccountTypes
CREATE TABLE accounttypes (
    id bigserial PRIMARY KEY,
    name varchar(75) NOT NULL,
    filepath varchar(255) NOT NULL,
    facebookappid varchar(50) NOT NULL,
    facebooksecretkey varchar(50) NOT NULL,
    twitterappid varchar(50) NOT NULL,
    twittersecret varchar(50) NOT NULL
);

-- Table: Affiliations
CREATE TABLE affiliations (
    id bigserial PRIMARY KEY,
    name varchar(75) NOT NULL UNIQUE,
    url varchar(200) NOT NULL
);

-- Table: Accounts
CREATE TABLE accounts(
    id bigserial PRIMARY KEY,
    name varchar(75) NOT NULL,
    firstyear integer NOT NULL DEFAULT 0,
    accounttypeid bigint NOT NULL,
    affiliationid bigint NOT NULL,
    timezoneid varchar(50) NOT NULL,
    twitteraccountname varchar(50) NOT NULL,
    twitteroauthtoken varchar(50) NOT NULL,
    twitteroauthsecretkey varchar(50) NOT NULL,
    youtubeuserid varchar(50),
    facebookfanpage varchar(50),
    twitterwidgetscript varchar(512),
    defaultvideo varchar(50) NOT NULL DEFAULT '',
    autoplayvideo boolean NOT NULL DEFAULT false,
    owneruserid varchar(128),
    FOREIGN KEY (owneruserid) REFERENCES aspnetusers (id),
    FOREIGN KEY (accounttypeid) REFERENCES accounttypes (id)
);

-- Table: contacts
CREATE TABLE contacts (
    id bigserial PRIMARY KEY,
    userid varchar(128),
    lastname varchar(25) NOT NULL,
    firstname varchar(25) NOT NULL,
    middlename varchar(25),
    phone1 varchar(14),
    phone2 varchar(14),
    phone3 varchar(14),
    creatoraccountid bigint NOT NULL,
    streetaddress varchar(75),
    city varchar(25),
    state varchar(25),
    zip varchar(15),
    dateofbirth timestamp NOT NULL,
    isfemale boolean DEFAULT false,
    email varchar(50),
    UNIQUE (lastname, firstname, middlename, creatoraccountid),
	FOREIGN KEY (creatoraccountid) REFERENCES accounts(id)
);

-- Table: AccountHandouts
CREATE TABLE accounthandouts (
    id bigserial PRIMARY KEY,
    description varchar(255) NOT NULL,
    filename varchar(255) NOT NULL,
    accountid bigint NOT NULL,
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: accountsettings
CREATE TABLE accountsettings (
    accountid bigint NOT NULL,
    settingkey varchar(25) NOT NULL,
    settingvalue varchar(25) NOT NULL,
    PRIMARY KEY (accountid, settingkey),
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
);
-- Table: AccountsURL
CREATE TABLE accountsurl (
    id bigserial PRIMARY KEY,
    accountid bigint NOT NULL,
    url varchar(200) NOT NULL,
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: teams
CREATE TABLE teams (
    id bigserial PRIMARY KEY,
    accountid bigint NOT NULL,
    webaddress varchar(100) NOT NULL,
    youtubeuserid varchar(100),
    defaultvideo varchar(50) NOT NULL DEFAULT '',
    autoplayvideo boolean NOT NULL DEFAULT false,
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: AccountWelcome
CREATE TABLE accountwelcome (
    id bigserial PRIMARY KEY,
    accountid bigint NOT NULL,
    orderno smallint NOT NULL,
    captionmenu varchar(50) NOT NULL,
    welcometext text NOT NULL,
    teamid bigint,
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (teamid) REFERENCES teams(id)
);

-- Table: aspnetroles
-- This table is used for ASP.NET Identity roles
CREATE TABLE aspnetroles (
    id varchar(128) NOT NULL PRIMARY KEY,
    name varchar(256) NOT NULL
);
-- Table: aspnetuserroles
-- This table is used for ASP.NET Identity user roles
CREATE TABLE aspnetuserroles (
    userid varchar(128) NOT NULL,
    roleid varchar(128) NOT NULL,
    PRIMARY KEY (userid, roleid),
    FOREIGN KEY (userid) REFERENCES aspnetusers(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (roleid) REFERENCES aspnetroles(id) ON UPDATE CASCADE ON DELETE CASCADE
);
-- Table: AvailableFields
-- This table stores information about available fields for games
CREATE TABLE availablefields (
    id bigserial PRIMARY KEY,
    accountid bigint NOT NULL,
    name varchar(25) NOT NULL,
    shortname varchar(5) NOT NULL,
    comment varchar(255) NOT NULL,
    address varchar(255) NOT NULL,
    city varchar(25) NOT NULL,
    state varchar(25) NOT NULL,
    zipcode varchar(10) NOT NULL,
    directions varchar(255) NOT NULL,
    rainoutnumber varchar(15) NOT NULL,
    latitude varchar(25) NOT NULL,
    longitude varchar(25) NOT NULL,
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: season
CREATE TABLE season (
    id bigserial PRIMARY KEY,
    accountid bigint NOT NULL,
    name varchar(25) NOT NULL,
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: league
CREATE TABLE league (
    id bigserial PRIMARY KEY,
    accountid bigint NOT NULL,
    name varchar(25) NOT NULL,
    FOREIGN KEY(accountid) REFERENCES accounts (id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: leagueseason
CREATE TABLE leagueseason (
    id bigserial PRIMARY KEY,
    leagueid bigint NOT NULL,
    seasonid bigint NOT NULL,
    FOREIGN KEY (leagueid) REFERENCES league(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (seasonid) REFERENCES season(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: leagueumpires
CREATE TABLE leagueumpires (
    id bigserial PRIMARY KEY,
    accountid bigint NOT NULL,
    contactid bigint NOT NULL,
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (contactid) REFERENCES contacts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: leagueschedule
CREATE TABLE leagueschedule (
    id bigserial PRIMARY KEY,
    gamedate timestamp NOT NULL,
    hteamid bigint NOT NULL,
    vteamid bigint NOT NULL,
    hscore integer NOT NULL DEFAULT 0,
    vscore integer NOT NULL DEFAULT 0,
    comment varchar(255) NOT NULL DEFAULT '',
    fieldid bigint,
    leagueid bigint NOT NULL,
    gamestatus integer NOT NULL,
    gametype bigint NOT NULL,
    umpire1 bigint,
    umpire2 bigint,
    umpire3 bigint,
    umpire4 bigint,
    --FOREIGN KEY (fieldid) REFERENCES availablefields(id) ON UPDATE CASCADE ON DELETE SET DEFAULT,
    FOREIGN KEY (leagueid) REFERENCES leagueseason(id) ON UPDATE CASCADE ON DELETE CASCADE,
    --FOREIGN KEY (umpire1) REFERENCES leagueumpires(id) ON UPDATE CASCADE ON DELETE SET DEFAULT,
    --FOREIGN KEY (umpire2) REFERENCES leagueumpires(id) ON UPDATE CASCADE ON DELETE SET DEFAULT,
    --FOREIGN KEY (umpire3) REFERENCES leagueumpires(id) ON UPDATE CASCADE ON DELETE SET DEFAULT,
    --FOREIGN KEY (umpire4) REFERENCES leagueumpires(id) ON UPDATE CASCADE ON DELETE SET DEFAULT      
);

-- Table: roster
CREATE TABLE roster (
    id bigserial PRIMARY KEY,
    contactid bigint NOT NULL,
    submitteddriverslicense boolean NOT NULL,
    firstyear integer NOT NULL,
    FOREIGN KEY (contactid) REFERENCES contacts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: divisiondefs
CREATE TABLE divisiondefs (
    id bigserial PRIMARY KEY,
    accountid bigint NOT NULL,
    name varchar(25) NOT NULL,
    FOREIGN KEY(accountid) REFERENCES accounts (id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: divisionseason
CREATE TABLE divisionseason (
    id bigserial PRIMARY KEY,
    divisionid bigint NOT NULL,
    leagueseasonid bigint NOT NULL,
    priority integer NOT NULL,
    FOREIGN KEY (divisionid) REFERENCES divisiondefs(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (leagueseasonid) REFERENCES leagueseason(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: teamsseason
CREATE TABLE teamsseason (
    id bigserial PRIMARY KEY,
    leagueseasonid bigint NOT NULL,
    teamid bigint NOT NULL,
    name varchar(25) NOT NULL,
    divisionseasonid bigint,
    FOREIGN KEY (leagueseasonid) REFERENCES leagueseason(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (teamid) REFERENCES teams(id) ON UPDATE CASCADE ON DELETE CASCADE,
    --FOREIGN KEY (divisionseasonid) REFERENCES divisionseason(id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- Table: rosterseason
CREATE TABLE rosterseason (
    id bigserial PRIMARY KEY,
    playerid bigint NOT NULL,
    teamseasonid bigint NOT NULL,
    playernumber integer NOT NULL,
    inactive boolean NOT NULL,
    submittedwaiver boolean NOT NULL,
    dateadded timestamp,
    FOREIGN KEY (playerid) REFERENCES roster(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (teamseasonid) REFERENCES teamsseason(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: batstatsum
-- This table stores batting statistics summary for players in games
CREATE TABLE batstatsum (
    id bigserial PRIMARY KEY,
    playerid bigint NOT NULL,
    gameid bigint NOT NULL,
    teamid bigint NOT NULL,
    ab int NOT NULL,
    h int NOT NULL,
    r int NOT NULL,
    d int NOT NULL,
    t int NOT NULL,
    hr int NOT NULL,
    rbi int NOT NULL,
    so int NOT NULL,
    bb int NOT NULL,
    re int NOT NULL,
    hbp int NOT NULL,
    intr int NOT NULL,
    sf int NOT NULL,
    sh int NOT NULL,
    sb int NOT NULL,
    cs int NOT NULL,
    lob int NOT NULL,
	tb_imported int,
	pa_imported int,
	obadenominator_imported int,
	obanumerator_imported int,
    tb int GENERATED ALWAYS AS ((((d * 2) + (t * 3)) + (hr * 4)) + ((h - d) - (t) - hr)) STORED,
    pa int GENERATED ALWAYS AS (((ab + bb) + hbp) + (sh + sf) + intr) STORED,
    obadenominator int GENERATED ALWAYS AS (ab + bb + hbp) STORED,
    obanumerator int GENERATED ALWAYS AS (h + bb + hbp) STORED,
    UNIQUE (playerid, gameid, teamid),
    FOREIGN KEY (gameid) REFERENCES leagueschedule (id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (playerid) REFERENCES rosterseason (id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (teamid) REFERENCES teamsseason (id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: ContactRoles
-- This table stores roles assigned to contacts within an account
CREATE TABLE contactroles (
    id bigserial PRIMARY KEY,
    contactid bigint NOT NULL,
    roleid varchar(128) NOT NULL,
    roldata bigint NOT NULL,
    accountid bigint NOT NULL,
    FOREIGN KEY (contactid) REFERENCES contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: currentseason
CREATE TABLE currentseason (
    seasonid bigint NOT NULL,
    accountid bigint PRIMARY KEY,
    FOREIGN KEY(accountid) REFERENCES accounts (id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: displayleagueleaders
CREATE TABLE displayleagueleaders (
    fieldname varchar(50) NOT NULL,
    accountid bigint NOT NULL,
    teamid bigint NOT NULL,
    isbatleader boolean NOT NULL,
    PRIMARY KEY (fieldname, isbatleader, accountid, teamid)
);

-- Table: fieldcontacts
CREATE TABLE fieldcontacts (
    id bigserial PRIMARY KEY,
    fieldid bigint NOT NULL,
    contactid bigint NOT NULL,
    FOREIGN KEY(fieldid) REFERENCES availablefields(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY(contactid) REFERENCES contacts (id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: fieldstatsum
CREATE TABLE fieldstatsum (
    id bigserial PRIMARY KEY,
    playerid bigint NOT NULL,
    gameid bigint NOT NULL,
    teamid bigint NOT NULL,
    pos integer NOT NULL,
    ip integer NOT NULL,
    ip2 integer NOT NULL,
    po integer NOT NULL,
    a integer NOT NULL,
    e integer NOT NULL,
    pb integer NOT NULL,
    sb integer NOT NULL,
    cs integer NOT NULL,
    UNIQUE (playerid, gameid, teamid, pos),
    FOREIGN KEY (gameid) REFERENCES leagueschedule(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (playerid) REFERENCES rosterseason(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (teamid) REFERENCES teamsseason(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: gameejections
CREATE TABLE gameejections (
    id bigserial PRIMARY KEY,
    leagueseasonid bigint NOT NULL,
    gameid bigint NOT NULL,
    playerseasonid bigint NOT NULL,
    umpireid bigint,
    comments text NOT NULL,
    FOREIGN KEY (gameid) REFERENCES leagueschedule(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (leagueseasonid) REFERENCES leagueseason(id),
    --FOREIGN KEY (umpireid) REFERENCES leagueumpires(id),
    FOREIGN KEY (playerseasonid) REFERENCES rosterseason(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: gamerecap
CREATE TABLE gamerecap (
    gameid bigint NOT NULL,
    teamid bigint NOT NULL,
    recap text NOT NULL,
    PRIMARY KEY (gameid, teamid),
    FOREIGN KEY (gameid) REFERENCES leagueschedule(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (teamid) REFERENCES teamsseason(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: golfcourse
CREATE TABLE golfcourse (
    id bigserial PRIMARY KEY,
    name varchar(100) NOT NULL,
    designer varchar(50),
    yearbuilt integer,
    numberofholes integer NOT NULL,
    address varchar(50),
    city varchar(50),
    state varchar(50),
    zip varchar(20),
    country varchar(30),
    menspar1 integer NOT NULL,
    menspar2 integer NOT NULL,
    menspar3 integer NOT NULL,
    menspar4 integer NOT NULL,
    menspar5 integer NOT NULL,
    menspar6 integer NOT NULL,
    menspar7 integer NOT NULL,
    menspar8 integer NOT NULL,
    menspar9 integer NOT NULL,
    menspar10 integer NOT NULL,
    menspar11 integer NOT NULL,
    menspar12 integer NOT NULL,
    menspar13 integer NOT NULL,
    menspar14 integer NOT NULL,
    menspar15 integer NOT NULL,
    menspar16 integer NOT NULL,
    menspar17 integer NOT NULL,
    menspar18 integer NOT NULL,
    womanspar1 integer NOT NULL,
    womanspar2 integer NOT NULL,
    womanspar3 integer NOT NULL,
    womanspar4 integer NOT NULL,
    womanspar5 integer NOT NULL,
    womanspar6 integer NOT NULL,
    womanspar7 integer NOT NULL,
    womanspar8 integer NOT NULL,
    womanspar9 integer NOT NULL,
    womanspar10 integer NOT NULL,
    womanspar11 integer NOT NULL,
    womanspar12 integer NOT NULL,
    womanspar13 integer NOT NULL,
    womanspar14 integer NOT NULL,
    womanspar15 integer NOT NULL,
    womanspar16 integer NOT NULL,
    womanspar17 integer NOT NULL,
    womanspar18 integer NOT NULL,
    menshandicap1 integer NOT NULL,
    menshandicap2 integer NOT NULL,
    menshandicap3 integer NOT NULL,
    menshandicap4 integer NOT NULL,
    menshandicap5 integer NOT NULL,
    menshandicap6 integer NOT NULL,
    menshandicap7 integer NOT NULL,
    menshandicap8 integer NOT NULL,
    menshandicap9 integer NOT NULL,
    menshandicap10 integer NOT NULL,
    menshandicap11 integer NOT NULL,
    menshandicap12 integer NOT NULL,
    menshandicap13 integer NOT NULL,
    menshandicap14 integer NOT NULL,
    menshandicap15 integer NOT NULL,
    menshandicap16 integer NOT NULL,
    menshandicap17 integer NOT NULL,
    menshandicap18 integer NOT NULL,
    womanshandicap1 integer NOT NULL,
    womanshandicap2 integer NOT NULL,
    womanshandicap3 integer NOT NULL,
    womanshandicap4 integer NOT NULL,
    womanshandicap5 integer NOT NULL,
    womanshandicap6 integer NOT NULL,
    womanshandicap7 integer NOT NULL,
    womanshandicap8 integer NOT NULL,
    womanshandicap9 integer NOT NULL,
    womanshandicap10 integer NOT NULL,
    womanshandicap11 integer NOT NULL,
    womanshandicap12 integer NOT NULL,
    womanshandicap13 integer NOT NULL,
    womanshandicap14 integer NOT NULL,
    womanshandicap15 integer NOT NULL,
    womanshandicap16 integer NOT NULL,
    womanshandicap17 integer NOT NULL,
    womanshandicap18 integer NOT NULL
);

-- Table: golfcourseforcontact
CREATE TABLE golfcourseforcontact (
    id bigserial PRIMARY KEY,
    contactid bigint NOT NULL,
    courseid bigint NOT NULL,
    FOREIGN KEY (contactid) REFERENCES contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (courseid) REFERENCES golfcourse(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: golfstatdef
CREATE TABLE golfstatdef (
    id bigserial PRIMARY KEY,
    name varchar(50) NOT NULL,
    shortname varchar(5) NOT NULL,
    datatype integer NOT NULL,
    iscalculated boolean NOT NULL,
    isperholevalue boolean NOT NULL,
    formulacode varchar(255) NOT NULL,
    validationcode varchar(255) NOT NULL,
    listvalues varchar(255) NOT NULL
);

-- Table: golferstatsconfiguration
CREATE TABLE golferstatsconfiguration (
    id bigserial PRIMARY KEY,
    contactid bigint NOT NULL,
    statid bigint NOT NULL,
    FOREIGN KEY (contactid) REFERENCES contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (statid) REFERENCES golfstatdef(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: golfteeinformation
CREATE TABLE golfteeinformation (
    id bigserial PRIMARY KEY,
    courseid bigint NOT NULL,
    teecolor varchar(20) NOT NULL,
    teename varchar(20) NOT NULL,
    mensrating double precision NOT NULL,
    menslope double precision NOT NULL,
    womansrating double precision NOT NULL,
    womanslope double precision NOT NULL,
    mensratingfront9 double precision NOT NULL,
    menslopefront9 double precision NOT NULL,
    womansratingfront9 double precision NOT NULL,
    womanslopefront9 double precision NOT NULL,
    mensratingback9 double precision NOT NULL,
    menslopeback9 double precision NOT NULL,
    womansratingback9 double precision NOT NULL,
    womanslopeback9 double precision NOT NULL,
    distancehole1 integer NOT NULL,
    distancehole2 integer NOT NULL,
    distancehole3 integer NOT NULL,
    distancehole4 integer NOT NULL,
    distancehole5 integer NOT NULL,
    distancehole6 integer NOT NULL,
    distancehole7 integer NOT NULL,
    distancehole8 integer NOT NULL,
    distancehole9 integer NOT NULL,
    distancehole10 integer NOT NULL,
    distancehole11 integer NOT NULL,
    distancehole12 integer NOT NULL,
    distancehole13 integer NOT NULL,
    distancehole14 integer NOT NULL,
    distancehole15 integer NOT NULL,
    distancehole16 integer NOT NULL,
    distancehole17 integer NOT NULL,
    distancehole18 integer NOT NULL,
    priority integer NOT NULL,
    FOREIGN KEY (courseid) REFERENCES golfcourse(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: golfscore
CREATE TABLE golfscore (
    id bigserial PRIMARY KEY,
    courseid bigint NOT NULL,
    contactid bigint NOT NULL,
    teeid bigint NOT NULL,
    dateplayed timestamp NOT NULL,
    holesplayed integer NOT NULL,
    totalscore integer NOT NULL,
    totalsonly boolean NOT NULL,
    holescrore1 integer NOT NULL,
    holescrore2 integer NOT NULL,
    holescrore3 integer NOT NULL,
    holescrore4 integer NOT NULL,
    holescrore5 integer NOT NULL,
    holescrore6 integer NOT NULL,
    holescrore7 integer NOT NULL,
    holescrore8 integer NOT NULL,
    holescrore9 integer NOT NULL,
    holescrore10 integer NOT NULL,
    holescrore11 integer NOT NULL,
    holescrore12 integer NOT NULL,
    holescrore13 integer NOT NULL,
    holescrore14 integer NOT NULL,
    holescrore15 integer NOT NULL,
    holescrore16 integer NOT NULL,
    holescrore17 integer NOT NULL,
    holescrore18 integer NOT NULL,
    startindex double precision,
    startindex9 double precision,
    FOREIGN KEY (courseid) REFERENCES golfcourse(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (contactid) REFERENCES contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (teeid) REFERENCES golfteeinformation(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: golferstatsvalue
CREATE TABLE golferstatsvalue (
    id bigserial PRIMARY KEY,
    scoreid bigint NOT NULL,
    contactid bigint NOT NULL,
    holeno integer NOT NULL,
    value varchar(100) NOT NULL,
    FOREIGN KEY (scoreid) REFERENCES golfscore(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (contactid) REFERENCES contacts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: golfleaguecourses
CREATE TABLE golfleaguecourses (
    accountid bigint NOT NULL,
    courseid bigint NOT NULL,
    defaultmenstee bigint,
    defaultwomanstee bigint,
    PRIMARY KEY (accountid, courseid),
    FOREIGN KEY (courseid) REFERENCES golfcourse(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: golfleaguesetup
CREATE TABLE golfleaguesetup (
    id bigint PRIMARY KEY,
    accountid bigint NOT NULL,
    presidentid bigint NOT NULL,
    vicepresidentid bigint NOT NULL,
    secretaryid bigint NOT NULL,
    treasurerid bigint NOT NULL,
    leagueday integer NOT NULL,
    firstteetime timestamp NOT NULL,
    timebetweenteetimes integer NOT NULL,
    holespermatch integer NOT NULL,
    teeoffformat integer NOT NULL,
    indnetperholepts integer NOT NULL,
    indnetperninepts integer NOT NULL,
    indnetpermatchpts integer NOT NULL,
    indnettotalholespts integer NOT NULL,
    indnetagainstfieldpts integer NOT NULL,
    indnetagainstfielddescpts integer NOT NULL,
    indactperholepts integer NOT NULL,
    indactperninepts integer NOT NULL,
    indactpermatchpts integer NOT NULL,
    indacttotalholespts integer NOT NULL,
    indactagainstfieldpts integer NOT NULL,
    indactagainstfielddescpts integer NOT NULL,
    teamnetperholepts integer NOT NULL,
    teamnetperninepts integer NOT NULL,
    teamnetpermatchpts integer NOT NULL,
    teamnettotalholespts integer NOT NULL,
    teamnetagainstfieldpts integer NOT NULL,
    teamactperholepts integer NOT NULL,
    teamactperninepts integer NOT NULL,
    teamactpermatchpts integer NOT NULL,
    teamacttotalholespts integer NOT NULL,
    teamactagainstfieldpts integer NOT NULL,
    teamagainstfielddescpts integer NOT NULL,
    teamnetbestballperholepts integer NOT NULL,
    teamactbestballperholepts integer NOT NULL,
    useteamscoring boolean NOT NULL,
    useindividualscoring boolean NOT NULL,
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (presidentid) REFERENCES contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (vicepresidentid) REFERENCES contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (secretaryid) REFERENCES contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (treasurerid) REFERENCES contacts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: golfmatch
CREATE TABLE golfmatch (
    id bigserial PRIMARY KEY,
    team1 bigint NOT NULL,
    team2 bigint NOT NULL,
    leagueid bigint NOT NULL,
    matchdate timestamp NOT NULL,
    matchtime timestamp NOT NULL,
    courseid bigint,
    matchstatus integer NOT NULL,
    matchtype integer NOT NULL,
    comment varchar(255) NOT NULL,
    FOREIGN KEY (team1) REFERENCES teamsseason(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (team2) REFERENCES teamsseason(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (leagueid) REFERENCES leagueseason(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (courseid) REFERENCES golfcourse(id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- Table: golfroster
CREATE TABLE golfroster (
    id bigserial PRIMARY KEY,
    contactid bigint NOT NULL,
    teamseasonid bigint NOT NULL,
    isactive boolean NOT NULL,
    initialdifferential double precision,
    issub boolean NOT NULL DEFAULT false,
    subseasonid bigint,
    FOREIGN KEY (contactid) REFERENCES contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (teamseasonid) REFERENCES teamsseason(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (subseasonid) REFERENCES leagueseason(id) ON UPDATE CASCADE ON DELETE SET NULL  
);

-- Table: golfmatchscores
CREATE TABLE golfmatchscores (
    matchid bigint NOT NULL,
    teamid bigint NOT NULL,
    playerid bigint NOT NULL,
    scoreid bigint NOT NULL,
    PRIMARY KEY (matchid, teamid, playerid, scoreid),
    FOREIGN KEY (matchid) REFERENCES golfmatch(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (teamid) REFERENCES teamsseason(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (playerid) REFERENCES golfroster(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (scoreid) REFERENCES golfscore(id) ON UPDATE CASCADE ON DELETE CASCADE

);

-- Table: hof
CREATE TABLE hof (
    id bigserial PRIMARY KEY,
    accountid bigint NOT NULL,
    yearinducted integer NOT NULL,
    contactid bigint NOT NULL,
    bio text NOT NULL,
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (contactid) REFERENCES contacts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: hofnomination
CREATE TABLE hofnomination (
    id bigserial PRIMARY KEY,
    accountid bigint NOT NULL,
    nominator varchar(50) NOT NULL,
    phonenumber varchar(14) NOT NULL,
    email varchar(75) NOT NULL,
    nominee varchar(50) NOT NULL,
    reason text NOT NULL,
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: hofnominationsetup
CREATE TABLE hofnominationsetup (
    accountid bigint PRIMARY KEY,
    enablenomination boolean NOT NULL,
    criteriatext text NOT NULL,
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: leagueevents
CREATE TABLE leagueevents (
    id bigserial PRIMARY KEY,
    eventdate timestamp NOT NULL,
    description varchar(25) NOT NULL,
    leagueseasonid bigint NOT NULL,
    FOREIGN KEY (leagueseasonid) REFERENCES leagueseason(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: leaguefaq
CREATE TABLE leaguefaq (
    id bigserial PRIMARY KEY,
    accountid bigint NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: leaguenews
CREATE TABLE leaguenews (
    id bigserial PRIMARY KEY,
    accountid bigint NOT NULL,
    date timestamp NOT NULL,
    title varchar(100) NOT NULL,
    text text NOT NULL,
    specialannounce boolean NOT NULL,
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: memberbusiness
CREATE TABLE memberbusiness (
    id bigserial PRIMARY KEY,
    contactid bigint NOT NULL,
    name varchar(50) NOT NULL,
    streetaddress varchar(100) NOT NULL,
    citystatezip varchar(100) NOT NULL,
    description text NOT NULL,
    email varchar(100) NOT NULL,
    phone varchar(14) NOT NULL,
    fax varchar(14) NOT NULL,
    website varchar(100) NOT NULL,
    FOREIGN KEY (contactid) REFERENCES contacts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: messagecategory
CREATE TABLE messagecategory (
    id bigserial PRIMARY KEY,
    accountid bigint NOT NULL,
    categoryorder integer NOT NULL,
    categoryname varchar(50) NOT NULL,
    categorydescription varchar(255) NOT NULL,
    allowanonymouspost boolean NOT NULL,
    allowanonymoustopic boolean NOT NULL,
    isteam boolean NOT NULL,
    ismoderated boolean NOT NULL
);

-- Table: messagetopic
CREATE TABLE messagetopic (
    id bigserial PRIMARY KEY,
    categoryid bigint NOT NULL,
    contactcreatorid bigint NOT NULL,
    topiccreatedate timestamp NOT NULL,
    topic varchar(255) NOT NULL,
    stickytopic boolean NOT NULL,
    numberofviews bigint NOT NULL,
    FOREIGN KEY (categoryid) REFERENCES messagecategory(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (contactcreatorid) REFERENCES contacts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: messagepost
CREATE TABLE messagepost (
    id bigserial PRIMARY KEY,
    topicid bigint NOT NULL,
    postorder integer NOT NULL,
    contactcreatorid bigint NOT NULL,
    postdate timestamp NOT NULL,
    posttext text NOT NULL,
    editdate timestamp NOT NULL,
    postsubject varchar(255) NOT NULL,
    categoryid bigint NOT NULL,
    FOREIGN KEY (topicid) REFERENCES messagetopic(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (contactcreatorid) REFERENCES contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (categoryid) REFERENCES messagecategory(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: photogalleryalbum
CREATE TABLE photogalleryalbum (
    id bigserial PRIMARY KEY,
    accountid bigint NOT NULL,
    title varchar(25) NOT NULL,
    parentalbumid bigint NOT NULL,
    teamid bigint NOT NULL
);

-- Table: photogallery
CREATE TABLE photogallery (
    id bigserial PRIMARY KEY,
    accountid bigint NOT NULL,
    title varchar(50) NOT NULL,
    caption varchar(255) NOT NULL,
    albumid bigint,
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE,
    --FOREIGN KEY (albumid) REFERENCES photogalleryalbum(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: pitchstatsum
CREATE TABLE pitchstatsum (
    id bigserial PRIMARY KEY,
    playerid bigint NOT NULL,
    gameid bigint NOT NULL,
    teamid bigint NOT NULL,
    ip integer NOT NULL,
    ip2 integer NOT NULL,
    bf integer NOT NULL,
    w integer NOT NULL,
    l integer NOT NULL,
    s integer NOT NULL,
    h integer NOT NULL,
    r integer NOT NULL,
    er integer NOT NULL,
    d integer NOT NULL,
    t integer NOT NULL,
    hr integer NOT NULL,
    so integer NOT NULL,
    bb integer NOT NULL,
    wp integer NOT NULL,
    hbp integer NOT NULL,
    bk integer NOT NULL,
    sc integer NOT NULL,
    tb_imported integer,
	ab_imported integer,
	whipnumerator_imported integer,
	ipnumerator_imported integer,
    tb int GENERATED ALWAYS AS (((d*(2)+t*(3))+hr*(4))+(((h-d)-t)-hr)) STORED,
	ab int GENERATED ALWAYS AS (((bf-bb)-hbp)-sc) STORED,
	whipnumerator int GENERATED ALWAYS AS (h+bb) STORED,
	ipnumerator int GENERATED ALWAYS AS (ip*(3)+ip2) STORED,
    UNIQUE (playerid, gameid, teamid),
    FOREIGN KEY (gameid) REFERENCES leagueschedule(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (playerid) REFERENCES rosterseason(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (teamid) REFERENCES teamsseason(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: profilecategory
CREATE TABLE profilecategory (
    id bigserial PRIMARY KEY,
    accountid bigint NOT NULL,
    categoryname varchar(40) NOT NULL,
    priority integer NOT NULL,
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: profilequestion
CREATE TABLE profilequestion (
    id bigserial PRIMARY KEY,
    categoryid bigint NOT NULL,
    question varchar(255) NOT NULL,
    questionnum integer NOT NULL,
    FOREIGN KEY (categoryid) REFERENCES profilecategory(id) ON UPDATE CASCADE ON DELETE CASCADE 
);

-- Table: playerprofile
CREATE TABLE playerprofile (
    id bigserial PRIMARY KEY,
    playerid bigint NOT NULL,
    questionid bigint NOT NULL,
    answer text NOT NULL,
    FOREIGN KEY (playerid) REFERENCES contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (questionid) REFERENCES profilequestion(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: playerrecap
CREATE TABLE playerrecap (
    playerid bigint NOT NULL,
    teamid bigint NOT NULL,
    gameid bigint NOT NULL,
    PRIMARY KEY (playerid, teamid, gameid),
    FOREIGN KEY (gameid) REFERENCES leagueschedule(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (playerid) REFERENCES rosterseason(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (teamid) REFERENCES teamsseason(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: playerseasonaffiliationdues
CREATE TABLE playerseasonaffiliationdues (
    playerid bigint NOT NULL,
    seasonid bigint NOT NULL,
    affiliationduespaid varchar(50) NOT NULL,
    PRIMARY KEY (playerid, seasonid),
    FOREIGN KEY (playerid) REFERENCES roster(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (seasonid) REFERENCES season(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: playerswantedclassified
CREATE TABLE playerswantedclassified (
    id bigserial PRIMARY KEY,
    accountid bigint NOT NULL,
    datecreated date NOT NULL,
    createdbycontactid bigint NOT NULL,
    teameventname varchar(50) NOT NULL,
    description text NOT NULL,
    positionsneeded varchar(50) NOT NULL,
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (createdbycontactid) REFERENCES contacts(id) ON UPDATE CASCADE ON DELETE CASCADE

);

-- Table: playoffsetup
CREATE TABLE playoffsetup (
    id bigserial PRIMARY KEY,
    leagueseasonid bigint NOT NULL,
    numteams integer NOT NULL,
    description varchar(50) NOT NULL,
    active boolean NOT NULL,
    FOREIGN KEY (leagueseasonid) REFERENCES leagueseason(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: playoffbracket
CREATE TABLE playoffbracket (
    id bigserial PRIMARY KEY,
    playoffid bigint NOT NULL,
    team1id bigint NOT NULL,
    team1idtype varchar(5) NOT NULL,
    team2id bigint NOT NULL,
    team2idtype varchar(5) NOT NULL,
    gameno integer NOT NULL,
    roundno integer NOT NULL,
    numgamesinseries integer NOT NULL,
    FOREIGN KEY (playoffid) REFERENCES playoffsetup(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: playoffgame
CREATE TABLE playoffgame (
    id bigserial PRIMARY KEY,
    bracketid bigint NOT NULL,
    fieldid bigint,
    gamedate timestamp NOT NULL,
    gametime timestamp NOT NULL,
    gameid bigint NOT NULL,
    playoffid bigint NOT NULL,
    seriesgameno integer NOT NULL,
    team1hometeam boolean NOT NULL,
    FOREIGN KEY (bracketid) REFERENCES playoffbracket(id) ON UPDATE CASCADE ON DELETE CASCADE,
    --FOREIGN KEY (fieldid) REFERENCES availablefields(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (playoffid) REFERENCES playoffsetup(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: playoffseeds
CREATE TABLE playoffseeds (
    id bigserial PRIMARY KEY,
    playoffid bigint NOT NULL,
    teamid bigint NOT NULL,
    seedno integer NOT NULL,
    FOREIGN KEY (playoffid) REFERENCES playoffsetup(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: sponsors
CREATE TABLE sponsors (
    id bigserial PRIMARY KEY,
    accountid bigint NOT NULL,
    name varchar(50) NOT NULL,
    streetaddress varchar(100) NOT NULL,
    citystatezip varchar(100) NOT NULL,
    description text NOT NULL,
    email varchar(100) NOT NULL,
    phone varchar(14) NOT NULL,
    fax varchar(14) NOT NULL,
    website varchar(100) NOT NULL,
    teamid bigint,
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE,
    --FOREIGN KEY (teamid) REFERENCES teams(id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- Table: teamhandouts
CREATE TABLE teamhandouts (
    id bigserial PRIMARY KEY,
    description varchar(255) NOT NULL,
    filename varchar(255) NOT NULL,
    teamid bigint NOT NULL,
    FOREIGN KEY (teamid) REFERENCES teams(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: teamnews
CREATE TABLE teamnews (
    id bigserial PRIMARY KEY,
    teamid bigint NOT NULL,
    date timestamp NOT NULL,
    text text NOT NULL,
    title varchar(100) NOT NULL,
    specialannounce boolean NOT NULL,
    FOREIGN KEY (teamid) REFERENCES teams(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: teamseasonmanager
CREATE TABLE teamseasonmanager (
    id bigserial PRIMARY KEY,
    teamseasonid bigint NOT NULL,
    contactid bigint NOT NULL,
    FOREIGN KEY (teamseasonid) REFERENCES teamsseason(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (contactid) REFERENCES contacts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: teamswantedclassified
CREATE TABLE teamswantedclassified (
    id bigserial PRIMARY KEY,
    accountid bigint NOT NULL,
    datecreated date NOT NULL,
    name varchar(50) NOT NULL,
    email varchar(50) NOT NULL,
    phone varchar(15) NOT NULL,
    experience text NOT NULL,
    positionsplayed varchar(50) NOT NULL,
    accesscode uuid NOT NULL,
    birthdate date NOT NULL,
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: votequestion
CREATE TABLE votequestion (
    id bigserial PRIMARY KEY,
    accountid bigint NOT NULL,
    question varchar(255) NOT NULL,
    active boolean NOT NULL,
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: voteoptions
CREATE TABLE voteoptions (
    id bigserial PRIMARY KEY,
    questionid bigint NOT NULL,
    optiontext varchar(255) NOT NULL,
    priority integer NOT NULL,
    FOREIGN KEY (questionid) REFERENCES votequestion(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: voteanswers
CREATE TABLE voteanswers (
    id bigserial PRIMARY KEY,
    questionid bigint NOT NULL,
    optionid bigint NOT NULL,
    contactid bigint NOT NULL,
    UNIQUE (questionid, optionid, contactid),
    FOREIGN KEY (questionid) REFERENCES votequestion(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (optionid) REFERENCES voteoptions(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (contactid) REFERENCES contacts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Table: workoutannouncement
CREATE TABLE workoutannouncement (
    id bigserial PRIMARY KEY,
    accountid bigint NOT NULL,
    workoutdesc text NOT NULL,
    workoutdate timestamp NOT NULL,
    fieldid bigint,
    comments text NOT NULL,
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (fieldid) REFERENCES availablefields(id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- Table: workoutregistration
CREATE TABLE workoutregistration (
    id bigserial PRIMARY KEY,
    name varchar(100) NOT NULL,
    email varchar(100) NOT NULL,
    age integer NOT NULL,
    phone1 varchar(14) NOT NULL,
    phone2 varchar(14) NOT NULL,
    phone3 varchar(14) NOT NULL,
    phone4 varchar(14) NOT NULL,
    positions varchar(50) NOT NULL,
    ismanager boolean NOT NULL,
    workoutid bigint NOT NULL,
    dateregistered timestamp NOT NULL,
    whereheard varchar(25) NOT NULL,
    FOREIGN KEY (workoutid) REFERENCES workoutannouncement(id) ON UPDATE CASCADE ON DELETE CASCADE
);
