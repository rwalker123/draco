-- Create table for per-account Facebook Page credentials.
CREATE TABLE "accountfacebookcredentials" (
  "id" BIGSERIAL PRIMARY KEY,
  "accountid" BIGINT NOT NULL,
  "pageid" VARCHAR(64),
  "pagename" VARCHAR(150),
  "appid" VARCHAR(128),
  "appsecret" TEXT,
  "useraccesstoken" TEXT,
  "useraccesstokenexpiresat" TIMESTAMPTZ,
  "pagetoken" TEXT,
  "createdat" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedat" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "accountfacebookcredentials"
  ADD CONSTRAINT "fk_accountfacebookcredentials_accounts"
  FOREIGN KEY ("accountid") REFERENCES "accounts" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "uq_accountfacebookcredentials_accountid"
  ON "accountfacebookcredentials" ("accountid");
