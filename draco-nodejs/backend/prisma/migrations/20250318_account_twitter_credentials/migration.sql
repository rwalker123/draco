-- Create table for per-account Twitter credentials and remove legacy columns.
ALTER TABLE "accounts"
  DROP COLUMN "twitteraccountname",
  DROP COLUMN "twitteroauthtoken",
  DROP COLUMN "twitteroauthsecretkey",
  DROP COLUMN "twitterwidgetscript";

CREATE TABLE "accounttwittercredentials" (
  "id" BIGSERIAL PRIMARY KEY,
  "accountid" BIGINT NOT NULL,
  "handle" VARCHAR(50) NOT NULL,
  "clientid" VARCHAR(128),
  "clientsecret" TEXT,
  "ingestionbearertoken" TEXT,
  "useraccesstoken" TEXT,
  "userrefreshtoken" TEXT,
  "useraccesstokenexpiresat" TIMESTAMPTZ,
  "scope" VARCHAR(512),
  "createdat" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedat" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "accounttwittercredentials"
  ADD CONSTRAINT "fk_accounttwittercredentials_accounts"
  FOREIGN KEY ("accountid") REFERENCES "accounts" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "uq_accounttwittercredentials_accountid"
  ON "accounttwittercredentials" ("accountid");
