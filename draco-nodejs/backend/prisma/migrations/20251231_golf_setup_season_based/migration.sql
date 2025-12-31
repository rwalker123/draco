-- Add leagueseasonid column to golfleaguesetup
ALTER TABLE golfleaguesetup ADD COLUMN leagueseasonid BIGINT NULL;

-- Add foreign key constraint
ALTER TABLE golfleaguesetup
  ADD CONSTRAINT fk_golfleaguesetup_leagueseason
  FOREIGN KEY (leagueseasonid) REFERENCES leagueseason(id) ON DELETE CASCADE;

-- Add unique constraint (one setup per season)
ALTER TABLE golfleaguesetup ADD CONSTRAINT uq_golfleaguesetup_leagueseasonid UNIQUE (leagueseasonid);
