
UPDATE leagueschedule
SET umpire1 = NULLIF(umpire1, 0),
    umpire2 = NULLIF(umpire2, 0),
    umpire3 = NULLIF(umpire3, 0),
    umpire4 = NULLIF(umpire4, 0),
    fieldid = NULLIF(fieldid, 0);
	
-- umpire id was the contactid and not umpireid, fix it.
UPDATE leagueschedule
SET umpire1 = 34
WHERE umpire1 = 2806;

UPDATE leagueschedule
set fieldid = NULL
where fieldid IN (20, 24);

ALTER TABLE leagueschedule
    ADD CONSTRAINT fk_leagueschedule_umpire1 FOREIGN KEY (umpire1) REFERENCES leagueumpires(id) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT fk_leagueschedule_umpire2 FOREIGN KEY (umpire2) REFERENCES leagueumpires(id) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT fk_leagueschedule_umpire3 FOREIGN KEY (umpire3) REFERENCES leagueumpires(id) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT fk_leagueschedule_umpire4 FOREIGN KEY (umpire4) REFERENCES leagueumpires(id) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT fk_leagueschedule_fieldid FOREIGN KEY (fieldid) REFERENCES availablefields(id) ON UPDATE CASCADE ON DELETE SET NULL;

UPDATE teamsseason
SET divisionseasonid = NULLIF(divisionseasonid, 0);

ALTER TABLE teamsseason
    ADD CONSTRAINT fk_teamsseason_divisionseasonid FOREIGN KEY (divisionseasonid) REFERENCES divisionseason(id) ON UPDATE CASCADE ON DELETE SET NULL;

UPDATE gameejections
SET umpireid = NULLIF(umpireid, 0);

UPDATE gameejections
SET umpireid = NULL
WHERE umpireid IN (23, 19, 12);

ALTER TABLE gameejections
    ADD CONSTRAINT fk_gameejections_umpireid FOREIGN KEY (umpireid) REFERENCES leagueumpires(id) ON UPDATE CASCADE ON DELETE SET NULL;

UPDATE photogallery
SET albumid = NULLIF(albumid, 0);

ALTER TABLE photogallery
    ADD CONSTRAINT fk_photogallery_albumid FOREIGN KEY (albumid) REFERENCES photogalleryalbum(id) ON UPDATE CASCADE ON DELETE SET NULL;

UPDATE playoffgame
SET fieldid = NULLIF(fieldid, 0);

UPDATE playoffgame
SET fieldid = NULL
WHERE fieldid IN (20, 24);

ALTER TABLE playoffgame
    ADD CONSTRAINT fk_playoffgame_fieldid FOREIGN KEY (fieldid) REFERENCES availablefields(id) ON UPDATE CASCADE ON DELETE SET NULL;

UPDATE sponsors
SET teamid = NULLIF(teamid, 0);

ALTER TABLE sponsors
    ADD CONSTRAINT fk_sponsors_teamid FOREIGN KEY (teamid) REFERENCES teams(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE batstatsum
DROP COLUMN tb_imported,
DROP COLUMN pa_imported,
DROP COLUMN obadenominator_imported,
DROP COLUMN obanumerator_imported;

ALTER TABLE pitchstatsum
DROP COLUMN tb_imported,
DROP COLUMN ab_imported,
DROP COLUMN whipnumerator_imported,
DROP COLUMN ipnumerator_imported;

ALTER TABLE aspnetusers
ADD CONSTRAINT uq_aspnetusers_username UNIQUE (username);

CREATE TABLE passwordresettokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userid VARCHAR(128) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expiresat TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    createdat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE contactroles
RENAME COLUMN roldata TO roledata;

SELECT SETVAL('accounttypes_id_seq', (SELECT MAX(id) FROM accounttypes) + 1);
SELECT SETVAL('affiliations_id_seq', (SELECT MAX(id) FROM affiliations) + 1);
SELECT SETVAL('accounts_id_seq', (SELECT MAX(id) FROM accounts) + 1);
SELECT SETVAL('contacts_id_seq', (SELECT MAX(id) FROM contacts) + 1);
SELECT SETVAL('accounthandouts_id_seq', (SELECT MAX(id) FROM accounthandouts) + 1);
SELECT SETVAL('accountsurl_id_seq', (SELECT MAX(id) FROM accountsurl) + 1);
SELECT SETVAL('teams_id_seq', (SELECT MAX(id) FROM teams) + 1);
SELECT SETVAL('accountwelcome_id_seq', (SELECT MAX(id) FROM accountwelcome) + 1);
SELECT SETVAL('availablefields_id_seq', (SELECT MAX(id) FROM availablefields) + 1);
SELECT SETVAL('season_id_seq', (SELECT MAX(id) FROM season) + 1);
SELECT SETVAL('league_id_seq', (SELECT MAX(id) FROM league) + 1);
SELECT SETVAL('leagueseason_id_seq', (SELECT MAX(id) FROM leagueseason) + 1);
SELECT SETVAL('leagueumpires_id_seq', (SELECT MAX(id) FROM leagueumpires) + 1);
SELECT SETVAL('leagueschedule_id_seq', (SELECT MAX(id) FROM leagueschedule) + 1);
SELECT SETVAL('roster_id_seq', (SELECT MAX(id) FROM roster) + 1);
SELECT SETVAL('divisiondefs_id_seq', (SELECT MAX(id) FROM divisiondefs) + 1);
SELECT SETVAL('divisionseason_id_seq', (SELECT MAX(id) FROM divisionseason) + 1);
SELECT SETVAL('teamsseason_id_seq', (SELECT MAX(id) FROM teamsseason) + 1);
SELECT SETVAL('rosterseason_id_seq', (SELECT MAX(id) FROM rosterseason) + 1);
SELECT SETVAL('batstatsum_id_seq', (SELECT MAX(id) FROM batstatsum) + 1);
SELECT SETVAL('contactroles_id_seq', (SELECT MAX(id) FROM contactroles) + 1);
SELECT SETVAL('fieldcontacts_id_seq', (SELECT MAX(id) FROM fieldcontacts) + 1);
SELECT SETVAL('fieldstatsum_id_seq', (SELECT MAX(id) FROM fieldstatsum) + 1);
SELECT SETVAL('gameejections_id_seq', (SELECT MAX(id) FROM gameejections) + 1);
SELECT SETVAL('golfcourse_id_seq', (SELECT MAX(id) FROM golfcourse) + 1);
SELECT SETVAL('golfcourseforcontact_id_seq', (SELECT MAX(id) FROM golfcourseforcontact) + 1);
SELECT SETVAL('golfstatdef_id_seq', (SELECT MAX(id) FROM golfstatdef) + 1);
SELECT SETVAL('golferstatsconfiguration_id_seq', (SELECT MAX(id) FROM golferstatsconfiguration) + 1);
SELECT SETVAL('golfteeinformation_id_seq', (SELECT MAX(id) FROM golfteeinformation) + 1);
SELECT SETVAL('golfscore_id_seq', (SELECT MAX(id) FROM golfscore) + 1);
SELECT SETVAL('golferstatsvalue_id_seq', (SELECT MAX(id) FROM golferstatsvalue) + 1);
SELECT SETVAL('golfleaguesetup_id_seq', (SELECT MAX(id) FROM golfleaguesetup) + 1);
SELECT SETVAL('golfmatch_id_seq', (SELECT MAX(id) FROM golfmatch) + 1);
SELECT SETVAL('golfroster_id_seq', (SELECT MAX(id) FROM golfroster) + 1);
SELECT SETVAL('hof_id_seq', (SELECT MAX(id) FROM hof) + 1);
SELECT SETVAL('hofnomination_id_seq', (SELECT MAX(id) FROM hofnomination) + 1);
SELECT SETVAL('leagueevents_id_seq', (SELECT MAX(id) FROM leagueevents) + 1);
SELECT SETVAL('leaguefaq_id_seq', (SELECT MAX(id) FROM leaguefaq) + 1);
SELECT SETVAL('leaguenews_id_seq', (SELECT MAX(id) FROM leaguenews) + 1);
SELECT SETVAL('memberbusiness_id_seq', (SELECT MAX(id) FROM memberbusiness) + 1);
SELECT SETVAL('messagecategory_id_seq', (SELECT MAX(id) FROM messagecategory) + 1);
SELECT SETVAL('messagetopic_id_seq', (SELECT MAX(id) FROM messagetopic) + 1);
SELECT SETVAL('messagepost_id_seq', (SELECT MAX(id) FROM messagepost) + 1);
SELECT SETVAL('photogalleryalbum_id_seq', (SELECT MAX(id) FROM photogalleryalbum) + 1);
SELECT SETVAL('photogallery_id_seq', (SELECT MAX(id) FROM photogallery) + 1);
SELECT SETVAL('pitchstatsum_id_seq', (SELECT MAX(id) FROM pitchstatsum) + 1);
SELECT SETVAL('profilecategory_id_seq', (SELECT MAX(id) FROM profilecategory) + 1);
SELECT SETVAL('profilequestion_id_seq', (SELECT MAX(id) FROM profilequestion) + 1);
SELECT SETVAL('playerprofile_id_seq', (SELECT MAX(id) FROM playerprofile) + 1);
SELECT SETVAL('playerswantedclassified_id_seq', (SELECT MAX(id) FROM playerswantedclassified) + 1);
SELECT SETVAL('playoffsetup_id_seq', (SELECT MAX(id) FROM playoffsetup) + 1);
SELECT SETVAL('playoffbracket_id_seq', (SELECT MAX(id) FROM playoffbracket) + 1);
SELECT SETVAL('playoffgame_id_seq', (SELECT MAX(id) FROM playoffgame) + 1);
SELECT SETVAL('playoffseeds_id_seq', (SELECT MAX(id) FROM playoffseeds) + 1);
SELECT SETVAL('sponsors_id_seq', (SELECT MAX(id) FROM sponsors) + 1);
SELECT SETVAL('teamhandouts_id_seq', (SELECT MAX(id) FROM teamhandouts) + 1);
SELECT SETVAL('teamnews_id_seq', (SELECT MAX(id) FROM teamnews) + 1);
SELECT SETVAL('teamseasonmanager_id_seq', (SELECT MAX(id) FROM teamseasonmanager) + 1);
SELECT SETVAL('teamswantedclassified_id_seq', (SELECT MAX(id) FROM teamswantedclassified) + 1);
SELECT SETVAL('votequestion_id_seq', (SELECT MAX(id) FROM votequestion) + 1);
SELECT SETVAL('voteoptions_id_seq', (SELECT MAX(id) FROM voteoptions) + 1);
SELECT SETVAL('voteanswers_id_seq', (SELECT MAX(id) FROM voteanswers) + 1);
SELECT SETVAL('workoutannouncement_id_seq', (SELECT MAX(id) FROM workoutannouncement) + 1);
SELECT SETVAL('workoutregistration_id_seq', (SELECT MAX(id) FROM workoutregistration) + 1);

-- fix issues with middle name being null not enforcing the unique constraint on firstname, lastname, middlename
update public.contacts
set middlename = 'a'
where (lastname = 'Brimm' and firstname = 'Alex' and middlename is null and creatoraccountid = 1) OR
      (lastname = 'Beyer' and firstname = 'Daniel' and middlename is null and creatoraccountid = 1) OR
      (lastname = 'Proodian' and firstname = 'Mark' and middlename is null and creatoraccountid = 1) OR
      (lastname = 'Fergestrom' and firstname = 'Mike' and middlename is null and creatoraccountid = 17) OR
      (lastname = 'Michelz' and firstname = 'Steve' and middlename is null and creatoraccountid = 1) OR
      (lastname = 'Wolfe' and firstname = 'Brian' and middlename is null and creatoraccountid = 1) OR
      (lastname = 'Whitbeck' and firstname = 'Joel' and middlename is null and creatoraccountid = 1) OR
      (lastname = 'Jones' and firstname = 'Eddie' and middlename is null and creatoraccountid = 1) OR
      (lastname = 'Davis' and firstname = 'Mike' and middlename is null and creatoraccountid = 1) OR
      (lastname = 'Powers' and firstname = 'Jeff' and middlename is null and creatoraccountid = 1) OR
      (lastname = 'Mick' and firstname = 'Spencer' and middlename is null and creatoraccountid = 1) 

UPDATE public.contacts
	SET middlename=''
	WHERE middlename is null;

ALTER TABLE public.contacts
ALTER COLUMN middlename SET NOT NULL;

ALTER TABLE IF EXISTS public.roster
    ADD CONSTRAINT roster_contactid UNIQUE (contactid);

-- Index for rosterseason player lookups and team season filtering
CREATE INDEX IF NOT EXISTS idx_rosterseason_playerid_teamseasonid ON rosterseason(playerid, teamseasonid);
CREATE INDEX IF NOT EXISTS idx_rosterseason_teamseasonid ON rosterseason(teamseasonid);
-- Index for teamsseason league season filtering
CREATE INDEX IF NOT EXISTS idx_teamsseason_leagueseasonid ON teamsseason(leagueseasonid);

-- Fix accesscode field to accept bcrypt hashes instead of UUIDs
-- This allows storing hashed access codes with special characters like $
ALTER TABLE teamswantedclassified 
ALTER COLUMN accesscode TYPE VARCHAR(255);
