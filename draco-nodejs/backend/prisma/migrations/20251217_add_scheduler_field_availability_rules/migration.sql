-- Scheduler field availability rules (A2.1) used to generate concrete fieldSlots in account local time.
CREATE TABLE schedulerfieldavailabilityrules (
  id BIGSERIAL PRIMARY KEY,
  accountid BIGINT NOT NULL,
  seasonid BIGINT NOT NULL,
  fieldid BIGINT NOT NULL,
  startdate DATE NOT NULL,
  enddate DATE NOT NULL,
  daysofweekmask SMALLINT NOT NULL,
  starttimelocal VARCHAR(5) NOT NULL,
  endtimelocal VARCHAR(5) NOT NULL,
  startincrementminutes SMALLINT NOT NULL DEFAULT 30,
  enabled BOOLEAN NOT NULL DEFAULT true,
  createdat TIMESTAMPTZ NOT NULL DEFAULT now(),
  updatedat TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_schedulerfieldavailabilityrules_accounts
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_schedulerfieldavailabilityrules_season
    FOREIGN KEY (seasonid) REFERENCES season(id) ON DELETE CASCADE,
  CONSTRAINT fk_schedulerfieldavailabilityrules_availablefields
    FOREIGN KEY (fieldid) REFERENCES availablefields(id) ON DELETE CASCADE
);

CREATE INDEX idx_schedulerfieldavailabilityrules_accountid
  ON schedulerfieldavailabilityrules(accountid);
CREATE INDEX idx_schedulerfieldavailabilityrules_seasonid
  ON schedulerfieldavailabilityrules(seasonid);
CREATE INDEX idx_schedulerfieldavailabilityrules_fieldid
  ON schedulerfieldavailabilityrules(fieldid);

