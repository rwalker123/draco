-- Make officer ID columns nullable and drop FK constraints
-- These fields should allow NULL when no officer is assigned

-- Drop existing foreign key constraints
ALTER TABLE golfleaguesetup DROP CONSTRAINT IF EXISTS fk_golfleaguesetup_contacts;
ALTER TABLE golfleaguesetup DROP CONSTRAINT IF EXISTS fk_golfleaguesetup_contacts1;
ALTER TABLE golfleaguesetup DROP CONSTRAINT IF EXISTS fk_golfleaguesetup_contacts2;
ALTER TABLE golfleaguesetup DROP CONSTRAINT IF EXISTS fk_golfleaguesetup_contacts3;

-- Make columns nullable
ALTER TABLE golfleaguesetup ALTER COLUMN presidentid DROP NOT NULL;
ALTER TABLE golfleaguesetup ALTER COLUMN vicepresidentid DROP NOT NULL;
ALTER TABLE golfleaguesetup ALTER COLUMN secretaryid DROP NOT NULL;
ALTER TABLE golfleaguesetup ALTER COLUMN treasurerid DROP NOT NULL;

-- Convert 0 values to NULL (0 was used as "no officer" placeholder)
UPDATE golfleaguesetup SET presidentid = NULL WHERE presidentid = 0;
UPDATE golfleaguesetup SET vicepresidentid = NULL WHERE vicepresidentid = 0;
UPDATE golfleaguesetup SET secretaryid = NULL WHERE secretaryid = 0;
UPDATE golfleaguesetup SET treasurerid = NULL WHERE treasurerid = 0;

-- Re-add foreign key constraints with NULL support
ALTER TABLE golfleaguesetup
  ADD CONSTRAINT fk_golfleaguesetup_contacts
  FOREIGN KEY (presidentid) REFERENCES contacts(id) ON DELETE SET NULL;

ALTER TABLE golfleaguesetup
  ADD CONSTRAINT fk_golfleaguesetup_contacts1
  FOREIGN KEY (vicepresidentid) REFERENCES contacts(id) ON DELETE SET NULL;

ALTER TABLE golfleaguesetup
  ADD CONSTRAINT fk_golfleaguesetup_contacts2
  FOREIGN KEY (secretaryid) REFERENCES contacts(id) ON DELETE SET NULL;

ALTER TABLE golfleaguesetup
  ADD CONSTRAINT fk_golfleaguesetup_contacts3
  FOREIGN KEY (treasurerid) REFERENCES contacts(id) ON DELETE SET NULL;
