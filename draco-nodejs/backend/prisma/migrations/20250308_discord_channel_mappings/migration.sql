CREATE TABLE IF NOT EXISTS accountdiscordchannels (
    id BIGSERIAL PRIMARY KEY,
    accountid BIGINT NOT NULL,
    channelid VARCHAR(32) NOT NULL,
    channelname VARCHAR(100) NOT NULL,
    channeltype VARCHAR(32),
    label VARCHAR(100),
    scope VARCHAR(32) NOT NULL,
    seasonid BIGINT,
    teamseasonid BIGINT,
    teamid BIGINT,
    createdat TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    updatedat TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    CONSTRAINT fk_accountdiscordchannels_accounts FOREIGN KEY (accountid) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_accountdiscordchannels_accountid ON accountdiscordchannels(accountid);
