-- Closed dates become ranges: closeddate is the range start, enddate the
-- optional inclusive end (NULL = single day).
ALTER TABLE "fieldcloseddates"
  ADD COLUMN "enddate" DATE;
