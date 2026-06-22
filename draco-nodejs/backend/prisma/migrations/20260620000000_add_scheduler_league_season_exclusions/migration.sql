CREATE TABLE schedulerleagueseasonexclusions (
  id BIGSERIAL PRIMARY KEY,
  accountid BIGINT NOT NULL,
  seasonid BIGINT NOT NULL,
  leagueseasonid BIGINT NOT NULL,
  starttime TIMESTAMPTZ NOT NULL,
  endtime TIMESTAMPTZ NOT NULL,
  note VARCHAR(255),
  enabled BOOLEAN NOT NULL DEFAULT true,
  createdat TIMESTAMPTZ NOT NULL DEFAULT now(),
  updatedat TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_schedulerleagueseasonexclusions_accounts
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_schedulerleagueseasonexclusions_season
    FOREIGN KEY (seasonid) REFERENCES season(id) ON DELETE CASCADE,
  CONSTRAINT fk_schedulerleagueseasonexclusions_leagueseason
    FOREIGN KEY (leagueseasonid) REFERENCES leagueseason(id) ON DELETE CASCADE
);
CREATE INDEX idx_schedulerleagueseasonexclusions_accountid ON schedulerleagueseasonexclusions(accountid);
CREATE INDEX idx_schedulerleagueseasonexclusions_seasonid ON schedulerleagueseasonexclusions(seasonid);
CREATE INDEX idx_schedulerleagueseasonexclusions_leagueseasonid ON schedulerleagueseasonexclusions(leagueseasonid);
