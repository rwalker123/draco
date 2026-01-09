-- CreateTable
CREATE TABLE "individuallivescoringsession" (
    "id" BIGSERIAL NOT NULL,
    "accountid" BIGINT NOT NULL,
    "golferid" BIGINT NOT NULL,
    "courseid" BIGINT NOT NULL,
    "teeid" BIGINT NOT NULL,
    "startedby" VARCHAR(128) NOT NULL,
    "startedat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastactivity" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" INTEGER NOT NULL DEFAULT 1,
    "currenthole" INTEGER NOT NULL DEFAULT 1,
    "holesplayed" INTEGER NOT NULL DEFAULT 18,
    "dateplayed" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "individuallivescoringsession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "individualliveholescore" (
    "id" BIGSERIAL NOT NULL,
    "sessionid" BIGINT NOT NULL,
    "holenumber" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "enteredby" VARCHAR(128) NOT NULL,
    "enteredat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "individualliveholescore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_indlivescoringsession_account" ON "individuallivescoringsession"("accountid");

-- CreateIndex
CREATE INDEX "idx_indlivescoringsession_status" ON "individuallivescoringsession"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_indlivescoringsession_account_active" ON "individuallivescoringsession"("accountid", "status");

-- CreateIndex
CREATE INDEX "idx_indliveholescore_session" ON "individualliveholescore"("sessionid");

-- CreateIndex
CREATE UNIQUE INDEX "uq_indliveholescore_session_hole" ON "individualliveholescore"("sessionid", "holenumber");

-- AddForeignKey
ALTER TABLE "individuallivescoringsession" ADD CONSTRAINT "fk_indlivescoringsession_accounts" FOREIGN KEY ("accountid") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individuallivescoringsession" ADD CONSTRAINT "fk_indlivescoringsession_golfer" FOREIGN KEY ("golferid") REFERENCES "golfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individuallivescoringsession" ADD CONSTRAINT "fk_indlivescoringsession_golfcourse" FOREIGN KEY ("courseid") REFERENCES "golfcourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individuallivescoringsession" ADD CONSTRAINT "fk_indlivescoringsession_golfteeinformation" FOREIGN KEY ("teeid") REFERENCES "golfteeinformation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individuallivescoringsession" ADD CONSTRAINT "fk_indlivescoringsession_aspnetusers" FOREIGN KEY ("startedby") REFERENCES "aspnetusers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individualliveholescore" ADD CONSTRAINT "fk_indliveholescore_session" FOREIGN KEY ("sessionid") REFERENCES "individuallivescoringsession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individualliveholescore" ADD CONSTRAINT "fk_indliveholescore_aspnetusers" FOREIGN KEY ("enteredby") REFERENCES "aspnetusers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
