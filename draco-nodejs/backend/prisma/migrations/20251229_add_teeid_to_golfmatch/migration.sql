-- Add teeid column to golfmatch table
ALTER TABLE "golfmatch" ADD COLUMN "teeid" BIGINT;

-- Add foreign key constraint
ALTER TABLE "golfmatch"
    ADD CONSTRAINT "fk_golfmatch_golfteeinformation"
    FOREIGN KEY ("teeid")
    REFERENCES "golfteeinformation"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- Create index for faster lookups
CREATE INDEX "golfmatch_teeid_idx" ON "golfmatch" ("teeid");
