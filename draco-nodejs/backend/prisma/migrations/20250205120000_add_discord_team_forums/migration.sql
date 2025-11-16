-- Alter accountdiscordsettings to track team forum feature state
ALTER TABLE "accountdiscordsettings"
  ADD COLUMN IF NOT EXISTS "teamforumenabled" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "teamforumlastsynced" TIMESTAMPTZ(6);

-- Create storage for per-team Discord forum metadata
CREATE TABLE IF NOT EXISTS "accountdiscordteamforums" (
  "id" BIGSERIAL PRIMARY KEY,
  "accountid" BIGINT NOT NULL,
  "seasonid" BIGINT NOT NULL,
  "teamseasonid" BIGINT NOT NULL,
  "teamid" BIGINT NOT NULL,
  "discordchannelid" VARCHAR(32) NOT NULL,
  "discordchannelname" VARCHAR(100) NOT NULL,
  "channeltype" VARCHAR(32),
  "discordroleid" VARCHAR(32),
  "status" VARCHAR(32) NOT NULL DEFAULT 'needsRepair',
  "autocreated" BOOLEAN NOT NULL DEFAULT FALSE,
  "lastsyncedat" TIMESTAMPTZ(6),
  "createdat" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updatedat" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_accountdiscordteamforums_accounts"
    FOREIGN KEY ("accountid") REFERENCES "accounts"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_accountdiscordteamforums_accountid"
  ON "accountdiscordteamforums" ("accountid");

CREATE UNIQUE INDEX IF NOT EXISTS "uq_accountdiscordteamforums_teamseason"
  ON "accountdiscordteamforums" ("teamseasonid");
