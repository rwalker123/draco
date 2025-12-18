-- Scheduler field exclusion dates: field is unavailable on specific dates (random blackouts).
CREATE TABLE schedulerfieldexclusiondates (
  id BIGSERIAL PRIMARY KEY,
  accountid BIGINT NOT NULL,
  seasonid BIGINT NOT NULL,
  fieldid BIGINT NOT NULL,
  exclusiondate DATE NOT NULL,
  note VARCHAR(255),
  enabled BOOLEAN NOT NULL DEFAULT true,
  createdat TIMESTAMPTZ NOT NULL DEFAULT now(),
  updatedat TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_schedulerfieldexclusiondates_accounts
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_schedulerfieldexclusiondates_season
    FOREIGN KEY (seasonid) REFERENCES season(id) ON DELETE CASCADE,
  CONSTRAINT fk_schedulerfieldexclusiondates_availablefields
    FOREIGN KEY (fieldid) REFERENCES availablefields(id) ON DELETE CASCADE,
  CONSTRAINT uq_schedulerfieldexclusiondates_account_season_field_date
    UNIQUE (accountid, seasonid, fieldid, exclusiondate)
);

CREATE INDEX idx_schedulerfieldexclusiondates_accountid
  ON schedulerfieldexclusiondates(accountid);
CREATE INDEX idx_schedulerfieldexclusiondates_seasonid
  ON schedulerfieldexclusiondates(seasonid);
CREATE INDEX idx_schedulerfieldexclusiondates_fieldid
  ON schedulerfieldexclusiondates(fieldid);

