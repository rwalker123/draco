CREATE TABLE schedulerrun (
  runid VARCHAR(255) PRIMARY KEY,
  accountid BIGINT NOT NULL,
  seasonid BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  processed INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0,
  result JSONB,
  error TEXT,
  createdat TIMESTAMPTZ NOT NULL DEFAULT now(),
  updatedat TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_schedulerrun_accounts
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_schedulerrun_season
    FOREIGN KEY (seasonid) REFERENCES season(id) ON DELETE CASCADE
);

CREATE INDEX idx_schedulerrun_account_season
  ON schedulerrun(accountid, seasonid);
