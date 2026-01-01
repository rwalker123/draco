-- Simplify Golf League Setup Scoring Configuration
--
-- Reduces 26 scoring-related fields to 8 simpler fields:
-- - scoringtype: 'individual' or 'team'
-- - usebestball: boolean (only valid when scoringtype='team' and teamsize > 1)
-- - usehandicapscoring: boolean (true = net/handicap, false = actual/gross)
-- - 6 point fields that apply universally
--
-- Also creates golfseasonconfig table for per-season settings like team size.

-- ============================================================================
-- PHASE A: Create golfseasonconfig table
-- ============================================================================

CREATE TABLE golfseasonconfig (
    id BIGSERIAL PRIMARY KEY,
    leagueseasonid BIGINT NOT NULL UNIQUE,
    teamsize INT NOT NULL DEFAULT 2,
    CONSTRAINT fk_golfseasonconfig_leagueseason FOREIGN KEY (leagueseasonid)
        REFERENCES leagueseason(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX idx_golfseasonconfig_leagueseasonid ON golfseasonconfig(leagueseasonid);

-- ============================================================================
-- PHASE B: Add new simplified columns to golfleaguesetup
-- ============================================================================

-- B1: Add scoringtype as varchar (will store 'individual' or 'team')
ALTER TABLE golfleaguesetup ADD COLUMN scoringtype VARCHAR(20) NOT NULL DEFAULT 'team';

-- B2: Add usebestball boolean
ALTER TABLE golfleaguesetup ADD COLUMN usebestball BOOLEAN NOT NULL DEFAULT false;

-- B3: Add usehandicapscoring boolean (true = net scoring, false = actual scoring)
ALTER TABLE golfleaguesetup ADD COLUMN usehandicapscoring BOOLEAN NOT NULL DEFAULT true;

-- B4: Add unified point fields
ALTER TABLE golfleaguesetup ADD COLUMN perholepoints INT NOT NULL DEFAULT 0;
ALTER TABLE golfleaguesetup ADD COLUMN perninepoints INT NOT NULL DEFAULT 0;
ALTER TABLE golfleaguesetup ADD COLUMN permatchpoints INT NOT NULL DEFAULT 0;
ALTER TABLE golfleaguesetup ADD COLUMN totalholespoints INT NOT NULL DEFAULT 0;
ALTER TABLE golfleaguesetup ADD COLUMN againstfieldpoints INT NOT NULL DEFAULT 0;
ALTER TABLE golfleaguesetup ADD COLUMN againstfielddescpoints INT NOT NULL DEFAULT 0;

-- ============================================================================
-- PHASE C: Drop old scoring columns
-- ============================================================================

-- C1: Drop toggle booleans
ALTER TABLE golfleaguesetup DROP COLUMN useteamscoring;
ALTER TABLE golfleaguesetup DROP COLUMN useindividualscoring;

-- C2: Drop individual net scoring fields
ALTER TABLE golfleaguesetup DROP COLUMN indnetperholepts;
ALTER TABLE golfleaguesetup DROP COLUMN indnetperninepts;
ALTER TABLE golfleaguesetup DROP COLUMN indnetpermatchpts;
ALTER TABLE golfleaguesetup DROP COLUMN indnettotalholespts;
ALTER TABLE golfleaguesetup DROP COLUMN indnetagainstfieldpts;
ALTER TABLE golfleaguesetup DROP COLUMN indnetagainstfielddescpts;

-- C3: Drop individual actual scoring fields
ALTER TABLE golfleaguesetup DROP COLUMN indactperholepts;
ALTER TABLE golfleaguesetup DROP COLUMN indactperninepts;
ALTER TABLE golfleaguesetup DROP COLUMN indactpermatchpts;
ALTER TABLE golfleaguesetup DROP COLUMN indacttotalholespts;
ALTER TABLE golfleaguesetup DROP COLUMN indactagainstfieldpts;
ALTER TABLE golfleaguesetup DROP COLUMN indactagainstfielddescpts;

-- C4: Drop team net scoring fields
ALTER TABLE golfleaguesetup DROP COLUMN teamnetperholepts;
ALTER TABLE golfleaguesetup DROP COLUMN teamnetperninepts;
ALTER TABLE golfleaguesetup DROP COLUMN teamnetpermatchpts;
ALTER TABLE golfleaguesetup DROP COLUMN teamnettotalholespts;
ALTER TABLE golfleaguesetup DROP COLUMN teamnetagainstfieldpts;

-- C5: Drop team actual scoring fields
ALTER TABLE golfleaguesetup DROP COLUMN teamactperholepts;
ALTER TABLE golfleaguesetup DROP COLUMN teamactperninepts;
ALTER TABLE golfleaguesetup DROP COLUMN teamactpermatchpts;
ALTER TABLE golfleaguesetup DROP COLUMN teamacttotalholespts;
ALTER TABLE golfleaguesetup DROP COLUMN teamactagainstfieldpts;
ALTER TABLE golfleaguesetup DROP COLUMN teamagainstfielddescpts;

-- C6: Drop team best ball fields
ALTER TABLE golfleaguesetup DROP COLUMN teamnetbestballperholepts;
ALTER TABLE golfleaguesetup DROP COLUMN teamactbestballperholepts;
