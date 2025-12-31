-- Create a sequence for golfleaguesetup id
CREATE SEQUENCE IF NOT EXISTS golfleaguesetup_id_seq;

-- Set the sequence value to be higher than the current max id
SELECT setval('golfleaguesetup_id_seq', COALESCE((SELECT MAX(id) FROM golfleaguesetup), 0) + 1, false);

-- Alter the id column to use the sequence as default
ALTER TABLE golfleaguesetup ALTER COLUMN id SET DEFAULT nextval('golfleaguesetup_id_seq');

-- Set ownership of the sequence to the column
ALTER SEQUENCE golfleaguesetup_id_seq OWNED BY golfleaguesetup.id;
