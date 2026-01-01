-- Add externalid column to golfcourse table
-- This stores the external API ID (from GolfCourseAPI.com) for imported courses
ALTER TABLE "golfcourse" ADD COLUMN "externalid" VARCHAR(50);

-- Create index for faster lookups by external ID
CREATE INDEX "golfcourse_externalid_idx" ON "golfcourse"("externalid");
