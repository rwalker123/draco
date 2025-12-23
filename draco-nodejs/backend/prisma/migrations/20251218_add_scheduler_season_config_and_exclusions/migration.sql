-- Scheduler season configuration: explicit season window for rule expansion defaults.
CREATE TABLE schedulerseasonconfig (
  seasonid BIGINT PRIMARY KEY,
  accountid BIGINT NOT NULL,
  startdate DATE NOT NULL,
  enddate DATE NOT NULL,
  createdat TIMESTAMPTZ NOT NULL DEFAULT now(),
  updatedat TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_schedulerseasonconfig_accounts
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_schedulerseasonconfig_season
    FOREIGN KEY (seasonid) REFERENCES season(id) ON DELETE CASCADE
);

CREATE INDEX idx_schedulerseasonconfig_accountid
  ON schedulerseasonconfig(accountid);

-- Scheduler season-level exclusions (date/time ranges).
CREATE TABLE schedulerseasonexclusions (
  id BIGSERIAL PRIMARY KEY,
  accountid BIGINT NOT NULL,
  seasonid BIGINT NOT NULL,
  starttime TIMESTAMPTZ NOT NULL,
  endtime TIMESTAMPTZ NOT NULL,
  note VARCHAR(255),
  enabled BOOLEAN NOT NULL DEFAULT true,
  createdat TIMESTAMPTZ NOT NULL DEFAULT now(),
  updatedat TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_schedulerseasonexclusions_accounts
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_schedulerseasonexclusions_season
    FOREIGN KEY (seasonid) REFERENCES season(id) ON DELETE CASCADE
);

CREATE INDEX idx_schedulerseasonexclusions_accountid
  ON schedulerseasonexclusions(accountid);
CREATE INDEX idx_schedulerseasonexclusions_seasonid
  ON schedulerseasonexclusions(seasonid);

-- Scheduler team-season exclusions (date/time ranges).
CREATE TABLE schedulerteamseasonexclusions (
  id BIGSERIAL PRIMARY KEY,
  accountid BIGINT NOT NULL,
  seasonid BIGINT NOT NULL,
  teamseasonid BIGINT NOT NULL,
  starttime TIMESTAMPTZ NOT NULL,
  endtime TIMESTAMPTZ NOT NULL,
  note VARCHAR(255),
  enabled BOOLEAN NOT NULL DEFAULT true,
  createdat TIMESTAMPTZ NOT NULL DEFAULT now(),
  updatedat TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_schedulerteamseasonexclusions_accounts
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_schedulerteamseasonexclusions_season
    FOREIGN KEY (seasonid) REFERENCES season(id) ON DELETE CASCADE,
  CONSTRAINT fk_schedulerteamseasonexclusions_teamsseason
    FOREIGN KEY (teamseasonid) REFERENCES teamsseason(id) ON DELETE CASCADE
);

CREATE INDEX idx_schedulerteamseasonexclusions_accountid
  ON schedulerteamseasonexclusions(accountid);
CREATE INDEX idx_schedulerteamseasonexclusions_seasonid
  ON schedulerteamseasonexclusions(seasonid);
CREATE INDEX idx_schedulerteamseasonexclusions_teamseasonid
  ON schedulerteamseasonexclusions(teamseasonid);

-- Scheduler umpire exclusions (date/time ranges).
CREATE TABLE schedulerumpireexclusions (
  id BIGSERIAL PRIMARY KEY,
  accountid BIGINT NOT NULL,
  seasonid BIGINT NOT NULL,
  umpireid BIGINT NOT NULL,
  starttime TIMESTAMPTZ NOT NULL,
  endtime TIMESTAMPTZ NOT NULL,
  note VARCHAR(255),
  enabled BOOLEAN NOT NULL DEFAULT true,
  createdat TIMESTAMPTZ NOT NULL DEFAULT now(),
  updatedat TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_schedulerumpireexclusions_accounts
    FOREIGN KEY (accountid) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_schedulerumpireexclusions_season
    FOREIGN KEY (seasonid) REFERENCES season(id) ON DELETE CASCADE,
  CONSTRAINT fk_schedulerumpireexclusions_leagueumpires
    FOREIGN KEY (umpireid) REFERENCES leagueumpires(id) ON DELETE CASCADE
);

CREATE INDEX idx_schedulerumpireexclusions_accountid
  ON schedulerumpireexclusions(accountid);
CREATE INDEX idx_schedulerumpireexclusions_seasonid
  ON schedulerumpireexclusions(seasonid);
CREATE INDEX idx_schedulerumpireexclusions_umpireid
  ON schedulerumpireexclusions(umpireid);

