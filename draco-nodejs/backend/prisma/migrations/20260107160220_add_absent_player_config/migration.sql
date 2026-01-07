-- AddAbsentPlayerConfiguration
ALTER TABLE golfleaguesetup ADD COLUMN absentplayermode INTEGER NOT NULL DEFAULT 0;
ALTER TABLE golfleaguesetup ADD COLUMN absentplayerpenalty INTEGER NOT NULL DEFAULT 0;
ALTER TABLE golfleaguesetup ADD COLUMN fullteamabsentmode INTEGER NOT NULL DEFAULT 0;
