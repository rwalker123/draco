-- Create table for per-account BlueSky credentials.
CREATE TABLE "accountblueskycredentials" (
  "id" BIGSERIAL PRIMARY KEY,
  "accountid" BIGINT NOT NULL,
  "blueskyhandle" VARCHAR(50) NOT NULL,
  "blueskyapppassword" TEXT,
  "createdat" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedat" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "accountblueskycredentials"
  ADD CONSTRAINT "fk_accountblueskycredentials_accounts"
  FOREIGN KEY ("accountid") REFERENCES "accounts" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "uq_accountblueskycredentials_accountid"
  ON "accountblueskycredentials" ("accountid");
