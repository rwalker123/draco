-- Make scheduler field availability rule start/end dates optional.
-- When omitted, the scheduler will treat them as the derived season window.

ALTER TABLE "schedulerfieldavailabilityrules"
  ALTER COLUMN "startdate" DROP NOT NULL,
  ALTER COLUMN "enddate" DROP NOT NULL;

