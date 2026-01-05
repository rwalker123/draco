-- Add total score fields to golfmatch for displaying strokes in match widgets
ALTER TABLE "golfmatch" ADD COLUMN "team1totalscore" INTEGER;
ALTER TABLE "golfmatch" ADD COLUMN "team2totalscore" INTEGER;
