-- AddHandicapStrokeMethodToGolfLeagueSetup
ALTER TABLE golfleaguesetup ADD COLUMN handicapstrokemethod VARCHAR(20) NOT NULL DEFAULT 'full';
