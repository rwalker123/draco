ALTER TABLE golfmatch ADD COLUMN weeknumber INT;

CREATE INDEX idx_golfmatch_league_week ON golfmatch(leagueid, weeknumber);
