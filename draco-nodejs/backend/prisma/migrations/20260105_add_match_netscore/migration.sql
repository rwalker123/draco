-- Add net score fields to golfmatch for displaying handicap-adjusted scores
ALTER TABLE "golfmatch" ADD COLUMN "team1netscore" INTEGER;
ALTER TABLE "golfmatch" ADD COLUMN "team2netscore" INTEGER;
