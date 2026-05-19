ALTER TABLE "rosterseason"
  ALTER COLUMN "playernumber" TYPE varchar(2)
  USING (CASE WHEN "playernumber" = 0 THEN '' ELSE "playernumber"::varchar END);

ALTER TABLE "rosterseason"
  ALTER COLUMN "playernumber" SET DEFAULT '';

ALTER TABLE "rosterseason"
  ADD CONSTRAINT "rosterseason_playernumber_check"
  CHECK ("playernumber" ~ '^[0-9]{0,2}$');
