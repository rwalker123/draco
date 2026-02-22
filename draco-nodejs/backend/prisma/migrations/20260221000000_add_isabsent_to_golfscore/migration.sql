-- AddIsAbsentToGolfscore
ALTER TABLE golfscore ADD COLUMN isabsent BOOLEAN NOT NULL DEFAULT false;
