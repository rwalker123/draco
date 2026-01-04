-- Add gender field to golfer table (M = Male, F = Female)
ALTER TABLE "golfer" ADD COLUMN "gender" VARCHAR(1) NOT NULL DEFAULT 'M';

-- Add low handicap index tracking for soft/hard cap calculations
ALTER TABLE "golfer" ADD COLUMN "lowhandicapindex" FLOAT;
