-- Golf Schema Redesign: Separate golfer identity from roster/substitute membership
--
-- VERIFIED CONSTRAINT NAMES from actual database:
--   golfroster: fk_golfroster_contacts, fk_golfroster_teamsseason, golfroster_subseasonid_fkey
--   golfmatchscores: fk_golfmatchscores_golfroster (NOT golfmatchscores_playerid_fkey)
--   golfscore: fk_golfscore_contacts
--
-- Current data: 12 roster rows (0 subs), 2 scores, 2 match scores

-- ============================================================================
-- PHASE A: Create new tables (no dependencies on existing data)
-- ============================================================================

-- A1: Create golfer table
CREATE TABLE golfer (
    id BIGSERIAL PRIMARY KEY,
    contactid BIGINT NOT NULL UNIQUE,
    initialdifferential DOUBLE PRECISION,
    CONSTRAINT fk_golfer_contact FOREIGN KEY (contactid)
        REFERENCES contacts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- A2: Create golfleaguesub table
CREATE TABLE golfleaguesub (
    id BIGSERIAL PRIMARY KEY,
    golferid BIGINT NOT NULL,
    seasonid BIGINT NOT NULL,
    isactive BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT fk_golfleaguesub_golfer FOREIGN KEY (golferid)
        REFERENCES golfer(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_golfleaguesub_leagueseason FOREIGN KEY (seasonid)
        REFERENCES leagueseason(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT uq_golfleaguesub_golfer_season UNIQUE (golferid, seasonid)
);

-- ============================================================================
-- PHASE B: Populate golfer table from existing data
-- ============================================================================

-- B1: Insert golfers from golfroster (one per unique contact, with their differential)
INSERT INTO golfer (contactid, initialdifferential)
SELECT DISTINCT ON (contactid) contactid, initialdifferential
FROM golfroster
ORDER BY contactid, id;

-- B2: Insert any contacts from golfscore that aren't already golfers
INSERT INTO golfer (contactid, initialdifferential)
SELECT DISTINCT contactid, NULL::DOUBLE PRECISION
FROM golfscore
WHERE contactid NOT IN (SELECT contactid FROM golfer);

-- ============================================================================
-- PHASE C: Migrate substitutes to golfleaguesub (before we delete them from golfroster)
-- ============================================================================

-- C1: Copy substitute entries to golfleaguesub
INSERT INTO golfleaguesub (golferid, seasonid, isactive)
SELECT g.id, gr.subseasonid, gr.isactive
FROM golfroster gr
JOIN golfer g ON g.contactid = gr.contactid
WHERE gr.issub = true AND gr.subseasonid IS NOT NULL;

-- ============================================================================
-- PHASE D: Add golferid columns to existing tables (nullable initially)
-- ============================================================================

-- D1: Add golferid to golfroster
ALTER TABLE golfroster ADD COLUMN golferid BIGINT;

-- D2: Add golferid to golfmatchscores
ALTER TABLE golfmatchscores ADD COLUMN golferid BIGINT;

-- D3: Add golferid to golfscore
ALTER TABLE golfscore ADD COLUMN golferid BIGINT;

-- D4: Add substitutefor to golfmatchscores (optional tracking of which roster spot was subbed)
ALTER TABLE golfmatchscores ADD COLUMN substitutefor BIGINT;

-- ============================================================================
-- PHASE E: Populate golferid columns from existing relationships
-- ============================================================================

-- E1: Populate golferid in golfroster
UPDATE golfroster gr
SET golferid = g.id
FROM golfer g
WHERE g.contactid = gr.contactid;

-- E2: Populate golferid in golfmatchscores (via golfroster -> golfer)
UPDATE golfmatchscores gms
SET golferid = g.id
FROM golfroster gr
JOIN golfer g ON g.contactid = gr.contactid
WHERE gms.playerid = gr.id;

-- E3: Populate golferid in golfscore
UPDATE golfscore gs
SET golferid = g.id
FROM golfer g
WHERE g.contactid = gs.contactid;

-- ============================================================================
-- PHASE F: Make golferid NOT NULL and add FK constraints
-- ============================================================================

-- F1: Make golferid NOT NULL after population
ALTER TABLE golfroster ALTER COLUMN golferid SET NOT NULL;
ALTER TABLE golfmatchscores ALTER COLUMN golferid SET NOT NULL;
ALTER TABLE golfscore ALTER COLUMN golferid SET NOT NULL;

-- F2: Add FK constraints for golferid
ALTER TABLE golfroster
    ADD CONSTRAINT fk_golfroster_golfer FOREIGN KEY (golferid)
    REFERENCES golfer(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE golfmatchscores
    ADD CONSTRAINT fk_golfmatchscores_golfer FOREIGN KEY (golferid)
    REFERENCES golfer(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE golfscore
    ADD CONSTRAINT fk_golfscore_golfer FOREIGN KEY (golferid)
    REFERENCES golfer(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- F3: Add substitutefor FK (nullable, references golfroster)
ALTER TABLE golfmatchscores
    ADD CONSTRAINT fk_golfmatchscores_substitutefor FOREIGN KEY (substitutefor)
    REFERENCES golfroster(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- ============================================================================
-- PHASE G: Delete substitute rows from golfroster (now in golfleaguesub)
-- ============================================================================

-- G1: Delete substitute rows (they're now in golfleaguesub)
DELETE FROM golfroster WHERE issub = true;

-- ============================================================================
-- PHASE H: Drop old columns and constraints
-- ============================================================================

-- H1: Drop old FK constraints from golfroster
ALTER TABLE golfroster DROP CONSTRAINT fk_golfroster_contacts;
ALTER TABLE golfroster DROP CONSTRAINT golfroster_subseasonid_fkey;

-- H2: Drop old columns from golfroster
ALTER TABLE golfroster DROP COLUMN contactid;
ALTER TABLE golfroster DROP COLUMN initialdifferential;
ALTER TABLE golfroster DROP COLUMN issub;
ALTER TABLE golfroster DROP COLUMN subseasonid;

-- H3: Drop old FK constraint from golfscore
ALTER TABLE golfscore DROP CONSTRAINT fk_golfscore_contacts;

-- H4: Drop old column from golfscore
ALTER TABLE golfscore DROP COLUMN contactid;

-- ============================================================================
-- PHASE I: Update golfmatchscores primary key (drop playerid)
-- ============================================================================

-- I1: Drop the old primary key
ALTER TABLE golfmatchscores DROP CONSTRAINT golfmatchscores_pkey;

-- I2: Drop the old FK constraint on playerid (ACTUAL constraint name!)
ALTER TABLE golfmatchscores DROP CONSTRAINT fk_golfmatchscores_golfroster;

-- I3: Drop playerid column
ALTER TABLE golfmatchscores DROP COLUMN playerid;

-- I4: Create new primary key with golferid
ALTER TABLE golfmatchscores
    ADD CONSTRAINT golfmatchscores_pkey PRIMARY KEY (matchid, teamid, golferid, scoreid);

-- ============================================================================
-- PHASE J: Add unique constraints and indexes
-- ============================================================================

-- J1: Unique constraint on golfroster (golfer can only be on one team per teamseason)
ALTER TABLE golfroster ADD CONSTRAINT uq_golfroster_golfer_team UNIQUE (golferid, teamseasonid);

-- J2: Create indexes for performance
CREATE INDEX idx_golfer_contactid ON golfer(contactid);
CREATE INDEX idx_golfleaguesub_seasonid ON golfleaguesub(seasonid);
CREATE INDEX idx_golfleaguesub_golferid ON golfleaguesub(golferid);
CREATE INDEX idx_golfroster_golferid ON golfroster(golferid);
CREATE INDEX idx_golfmatchscores_golferid ON golfmatchscores(golferid);
CREATE INDEX idx_golfscore_golferid ON golfscore(golferid);
