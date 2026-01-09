-- CreateTable
CREATE TABLE "baseballlivescoringsession" (
    "id" BIGSERIAL NOT NULL,
    "gameid" BIGINT NOT NULL,
    "startedby" VARCHAR(128) NOT NULL,
    "startedat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastactivity" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" INTEGER NOT NULL DEFAULT 1,
    "currentinning" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "baseballlivescoringsession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baseballliveinningscore" (
    "id" BIGSERIAL NOT NULL,
    "sessionid" BIGINT NOT NULL,
    "inningnumber" INTEGER NOT NULL,
    "ishometeam" BOOLEAN NOT NULL,
    "runs" INTEGER NOT NULL,
    "enteredby" VARCHAR(128) NOT NULL,
    "enteredat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "baseballliveinningscore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "baseballlivescoringsession_gameid_key" ON "baseballlivescoringsession"("gameid");

-- CreateIndex
CREATE INDEX "idx_baseballlivescoringsession_game" ON "baseballlivescoringsession"("gameid");

-- CreateIndex
CREATE INDEX "idx_baseballlivescoringsession_status" ON "baseballlivescoringsession"("status");

-- CreateIndex
CREATE INDEX "idx_baseballliveinningscore_session" ON "baseballliveinningscore"("sessionid");

-- CreateIndex
CREATE UNIQUE INDEX "uq_baseballliveinningscore_session_inning_team" ON "baseballliveinningscore"("sessionid", "inningnumber", "ishometeam");

-- AddForeignKey
ALTER TABLE "baseballlivescoringsession" ADD CONSTRAINT "fk_baseballlivescoringsession_leagueschedule" FOREIGN KEY ("gameid") REFERENCES "leagueschedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baseballlivescoringsession" ADD CONSTRAINT "fk_baseballlivescoringsession_aspnetusers" FOREIGN KEY ("startedby") REFERENCES "aspnetusers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baseballliveinningscore" ADD CONSTRAINT "fk_baseballliveinningscore_session" FOREIGN KEY ("sessionid") REFERENCES "baseballlivescoringsession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baseballliveinningscore" ADD CONSTRAINT "fk_baseballliveinningscore_aspnetusers" FOREIGN KEY ("enteredby") REFERENCES "aspnetusers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
