-- CreateTable
CREATE TABLE "livescoringsession" (
    "id" BIGSERIAL NOT NULL,
    "matchid" BIGINT NOT NULL,
    "startedby" VARCHAR(128) NOT NULL,
    "startedat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastactivity" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" INTEGER NOT NULL DEFAULT 1,
    "currenthole" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "livescoringsession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liveholescore" (
    "id" BIGSERIAL NOT NULL,
    "sessionid" BIGINT NOT NULL,
    "golferid" BIGINT NOT NULL,
    "holenumber" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "enteredby" VARCHAR(128) NOT NULL,
    "enteredat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "liveholescore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "livescoringsession_matchid_key" ON "livescoringsession"("matchid");

-- CreateIndex
CREATE INDEX "idx_livescoringsession_match" ON "livescoringsession"("matchid");

-- CreateIndex
CREATE INDEX "idx_livescoringsession_status" ON "livescoringsession"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_liveholescore_session_golfer_hole" ON "liveholescore"("sessionid", "golferid", "holenumber");

-- CreateIndex
CREATE INDEX "idx_liveholescore_session" ON "liveholescore"("sessionid");

-- AddForeignKey
ALTER TABLE "livescoringsession" ADD CONSTRAINT "fk_livescoringsession_golfmatch" FOREIGN KEY ("matchid") REFERENCES "golfmatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "livescoringsession" ADD CONSTRAINT "fk_livescoringsession_aspnetusers" FOREIGN KEY ("startedby") REFERENCES "aspnetusers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liveholescore" ADD CONSTRAINT "fk_liveholescore_session" FOREIGN KEY ("sessionid") REFERENCES "livescoringsession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liveholescore" ADD CONSTRAINT "fk_liveholescore_golfer" FOREIGN KEY ("golferid") REFERENCES "golfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liveholescore" ADD CONSTRAINT "fk_liveholescore_aspnetusers" FOREIGN KEY ("enteredby") REFERENCES "aspnetusers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
