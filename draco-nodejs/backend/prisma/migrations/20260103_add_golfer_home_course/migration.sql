-- Add home course field to golfer table
ALTER TABLE "golfer" ADD COLUMN "homecourseid" BIGINT;

-- Add foreign key constraint
ALTER TABLE "golfer" ADD CONSTRAINT "fk_golfer_homecourse" FOREIGN KEY ("homecourseid") REFERENCES "golfcourse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
