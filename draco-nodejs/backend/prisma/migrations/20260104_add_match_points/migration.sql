-- Add points storage fields to golfmatch for individual scoring
ALTER TABLE "golfmatch" ADD COLUMN "team1points" DOUBLE PRECISION;
ALTER TABLE "golfmatch" ADD COLUMN "team2points" DOUBLE PRECISION;
ALTER TABLE "golfmatch" ADD COLUMN "team1holewins" INTEGER;
ALTER TABLE "golfmatch" ADD COLUMN "team2holewins" INTEGER;
ALTER TABLE "golfmatch" ADD COLUMN "team1ninewins" INTEGER;
ALTER TABLE "golfmatch" ADD COLUMN "team2ninewins" INTEGER;
ALTER TABLE "golfmatch" ADD COLUMN "team1matchwins" INTEGER;
ALTER TABLE "golfmatch" ADD COLUMN "team2matchwins" INTEGER;
