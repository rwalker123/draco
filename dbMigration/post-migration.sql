
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