-- Remove redundant matchtime column from golfmatch
-- The matchdate column already stores the full timestamp with time
ALTER TABLE "golfmatch" DROP COLUMN "matchtime";
