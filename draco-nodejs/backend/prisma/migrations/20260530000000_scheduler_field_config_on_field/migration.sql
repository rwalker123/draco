-- Season Scheduler field-config refactor: move field open-hours / closed-dates /
-- game-time limits off the season-scoped scheduler tables and onto the field entity.

-- 1. New field-entity columns on availablefields.
ALTER TABLE "availablefields"
  ADD COLUMN "scheduleenabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "gamelengthminutes" SMALLINT,
  ADD COLUMN "bufferminutes" SMALLINT NOT NULL DEFAULT 0;

-- 2. Retire the per-field scheduler start increment (superseded by gamelengthminutes + bufferminutes).
ALTER TABLE "availablefields"
  DROP COLUMN "schedulerstartincrementminutes";

-- 3. Field open hours: one row per OPEN day of week (no row = closed that day).
CREATE TABLE fieldopenhours (
  id BIGSERIAL PRIMARY KEY,
  fieldid BIGINT NOT NULL,
  dayofweek SMALLINT NOT NULL,
  starttimelocal VARCHAR(5) NOT NULL,
  endtimelocal VARCHAR(5) NOT NULL,
  createdat TIMESTAMPTZ NOT NULL DEFAULT now(),
  updatedat TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_fieldopenhours_availablefields
    FOREIGN KEY (fieldid) REFERENCES availablefields(id) ON DELETE CASCADE,
  CONSTRAINT uq_fieldopenhours_field_dayofweek
    UNIQUE (fieldid, dayofweek)
);

CREATE INDEX idx_fieldopenhours_fieldid
  ON fieldopenhours(fieldid);

-- 4. Field closed dates: one-off field closures by date.
CREATE TABLE fieldcloseddates (
  id BIGSERIAL PRIMARY KEY,
  fieldid BIGINT NOT NULL,
  closeddate DATE NOT NULL,
  note VARCHAR(255),
  createdat TIMESTAMPTZ NOT NULL DEFAULT now(),
  updatedat TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_fieldcloseddates_availablefields
    FOREIGN KEY (fieldid) REFERENCES availablefields(id) ON DELETE CASCADE,
  CONSTRAINT uq_fieldcloseddates_field_date
    UNIQUE (fieldid, closeddate)
);

CREATE INDEX idx_fieldcloseddates_fieldid
  ON fieldcloseddates(fieldid);

-- 5. Drop the retired season-scoped scheduler field tables.
DROP TABLE IF EXISTS schedulerfieldavailabilityrules;
DROP TABLE IF EXISTS schedulerfieldexclusiondates;
