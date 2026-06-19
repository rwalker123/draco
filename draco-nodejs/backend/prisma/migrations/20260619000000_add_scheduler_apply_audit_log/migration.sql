CREATE TABLE schedulerapplyauditlog (
  id BIGSERIAL PRIMARY KEY,
  accountid BIGINT NOT NULL,
  seasonid BIGINT NOT NULL,
  runid VARCHAR(255) NOT NULL,
  mode VARCHAR(10) NOT NULL,
  appliedbyuserid VARCHAR(128) NOT NULL,
  appliedbyusername VARCHAR(255) NOT NULL,
  appliedcount INT NOT NULL,
  skippedcount INT NOT NULL,
  createdat TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_schedulerapplyauditlog_accounts
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_schedulerapplyauditlog_season
    FOREIGN KEY (seasonid) REFERENCES season(id) ON DELETE CASCADE
);

CREATE INDEX idx_schedulerapplyauditlog_account_season
  ON schedulerapplyauditlog(accountid, seasonid);
