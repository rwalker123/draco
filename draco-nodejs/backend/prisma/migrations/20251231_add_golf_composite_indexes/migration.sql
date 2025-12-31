-- Add composite indexes for common golf query patterns

-- Composite index for findByTeamAndMatch queries (matchid, teamid)
-- Used in golfScoreService.getScoresForTeamInMatch and submitMatchResults
CREATE INDEX idx_golfmatchscores_match_team ON golfmatchscores(matchid, teamid);

-- Composite index for player history queries (golferid, dateplayed)
-- Used for sorting player scores by date in getScoresForPlayer
CREATE INDEX idx_golfscore_golfer_dateplayed ON golfscore(golferid, dateplayed DESC);
