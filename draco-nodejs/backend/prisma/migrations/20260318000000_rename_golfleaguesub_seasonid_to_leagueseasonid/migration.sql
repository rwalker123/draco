-- RenameGolfLeagueSubSeasonIdToLeagueSeasonId
ALTER TABLE golfleaguesub RENAME COLUMN seasonid TO leagueseasonid;

-- Rename the index on the column
ALTER INDEX idx_golfleaguesub_seasonid RENAME TO idx_golfleaguesub_leagueseasonid;
