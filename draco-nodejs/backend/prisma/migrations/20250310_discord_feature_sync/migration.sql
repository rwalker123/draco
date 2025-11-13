CREATE TABLE IF NOT EXISTS accountdiscordfeaturesync (
    id BIGSERIAL PRIMARY KEY,
    accountid BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    feature VARCHAR(64) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    discordchannelid VARCHAR(32),
    discordchannelname VARCHAR(100),
    channeltype VARCHAR(32),
    autocreated BOOLEAN NOT NULL DEFAULT FALSE,
    lastsyncedat TIMESTAMPTZ,
    createdat TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    updatedat TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS u_accountdiscordfeaturesync_account_feature
  ON accountdiscordfeaturesync(accountid, feature);
