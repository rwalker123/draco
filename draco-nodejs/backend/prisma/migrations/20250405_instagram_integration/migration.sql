-- CreateTable
CREATE TABLE "accountinstagramcredentials" (
    "id" BIGSERIAL PRIMARY KEY,
    "accountid" BIGINT NOT NULL,
    "instagramuserid" VARCHAR(64),
    "username" VARCHAR(100),
    "appid" VARCHAR(128),
    "appsecret" TEXT,
    "accesstoken" TEXT,
    "refreshtoken" TEXT,
    "accesstokenexpiresat" TIMESTAMPTZ(6),
    "createdat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "uq_accountinstagramcredentials_accountid" ON "accountinstagramcredentials"("accountid");

ALTER TABLE "accountinstagramcredentials"
  ADD CONSTRAINT "fk_accountinstagramcredentials_accounts"
  FOREIGN KEY ("accountid") REFERENCES "accounts"("id") ON DELETE CASCADE;

-- CreateTable
CREATE TABLE "instagramingestion" (
    "id" BIGSERIAL PRIMARY KEY,
    "accountid" BIGINT NOT NULL,
    "externalid" VARCHAR(100) NOT NULL,
    "photoid" BIGINT NOT NULL,
    "postedat" TIMESTAMPTZ(6),
    "permalink" VARCHAR(512),
    "createdat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_instagramingestion_accountid" ON "instagramingestion"("accountid");
CREATE UNIQUE INDEX "uq_instagramingestion_account_externalid" ON "instagramingestion"("accountid", "externalid");

ALTER TABLE "instagramingestion"
  ADD CONSTRAINT "fk_instagramingestion_accounts"
  FOREIGN KEY ("accountid") REFERENCES "accounts"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "fk_instagramingestion_photogallery"
  FOREIGN KEY ("photoid") REFERENCES "photogallery"("id") ON DELETE CASCADE;

-- AlterTable
ALTER TABLE "photogalleryalbum"
  ADD COLUMN "issystem" BOOLEAN NOT NULL DEFAULT FALSE;
