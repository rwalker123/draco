CREATE TABLE "socialliveevents" (
    "id" BIGSERIAL PRIMARY KEY,
    "leagueeventid" BIGINT NOT NULL UNIQUE,
    "teamseasonid" BIGINT,
    "title" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "streamplatform" VARCHAR(50),
    "streamurl" VARCHAR(512),
    "discordchannelid" VARCHAR(32),
    "location" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL DEFAULT 'upcoming',
    "featured" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedat" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "socialliveevents_leagueeventid_fkey"
        FOREIGN KEY ("leagueeventid")
        REFERENCES "leagueevents"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "socialliveevents_teamseasonid_fkey"
        FOREIGN KEY ("teamseasonid")
        REFERENCES "teamsseason"("id")
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX "idx_socialliveevents_teamseasonid" ON "socialliveevents" ("teamseasonid");

CREATE TABLE "socialfeeditems" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountid" BIGINT NOT NULL,
    "seasonid" BIGINT NOT NULL,
    "teamid" BIGINT,
    "teamseasonid" BIGINT,
    "source" VARCHAR(30) NOT NULL,
    "channelname" VARCHAR(100) NOT NULL,
    "authorname" VARCHAR(100),
    "authorhandle" VARCHAR(100),
    "content" TEXT NOT NULL,
    "media" JSONB,
    "metadata" JSONB,
    "postedat" TIMESTAMPTZ NOT NULL,
    "permalink" VARCHAR(512),
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedat" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "socialfeeditems_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "socialfeeditems_accountid_fkey" FOREIGN KEY ("accountid") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "socialfeeditems_seasonid_fkey" FOREIGN KEY ("seasonid") REFERENCES "season"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "socialfeeditems_teamid_fkey" FOREIGN KEY ("teamid") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "socialfeeditems_teamseasonid_fkey" FOREIGN KEY ("teamseasonid") REFERENCES "teamsseason"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "idx_socialfeeditems_accountid" ON "socialfeeditems" ("accountid");
CREATE INDEX "idx_socialfeeditems_seasonid" ON "socialfeeditems" ("seasonid");
CREATE INDEX "idx_socialfeeditems_postedat" ON "socialfeeditems" ("postedat");

CREATE TABLE "socialvideos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountid" BIGINT NOT NULL,
    "seasonid" BIGINT NOT NULL,
    "teamid" BIGINT,
    "teamseasonid" BIGINT,
    "source" VARCHAR(30) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "durationseconds" INTEGER,
    "thumbnailurl" VARCHAR(512) NOT NULL,
    "videourl" VARCHAR(512) NOT NULL,
    "islive" BOOLEAN NOT NULL DEFAULT FALSE,
    "publishedat" TIMESTAMPTZ NOT NULL,
    "metadata" JSONB,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedat" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "socialvideos_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "socialvideos_accountid_fkey" FOREIGN KEY ("accountid") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "socialvideos_seasonid_fkey" FOREIGN KEY ("seasonid") REFERENCES "season"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "socialvideos_teamid_fkey" FOREIGN KEY ("teamid") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "socialvideos_teamseasonid_fkey" FOREIGN KEY ("teamseasonid") REFERENCES "teamsseason"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "idx_socialvideos_accountid" ON "socialvideos" ("accountid");
CREATE INDEX "idx_socialvideos_seasonid" ON "socialvideos" ("seasonid");
CREATE INDEX "idx_socialvideos_publishedat" ON "socialvideos" ("publishedat");

CREATE TABLE "discordmessages" (
    "id" VARCHAR(32) NOT NULL,
    "accountid" BIGINT NOT NULL,
    "seasonid" BIGINT NOT NULL,
    "teamid" BIGINT,
    "teamseasonid" BIGINT,
    "channelid" VARCHAR(32) NOT NULL,
    "channelname" VARCHAR(100) NOT NULL,
    "authorid" VARCHAR(32) NOT NULL,
    "authorname" VARCHAR(100) NOT NULL,
    "avatarurl" VARCHAR(512),
    "content" TEXT NOT NULL,
    "attachments" JSONB,
    "postedat" TIMESTAMPTZ NOT NULL,
    "permalink" VARCHAR(512) NOT NULL,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedat" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "discordmessages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "discordmessages_accountid_fkey" FOREIGN KEY ("accountid") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "discordmessages_seasonid_fkey" FOREIGN KEY ("seasonid") REFERENCES "season"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "discordmessages_teamid_fkey" FOREIGN KEY ("teamid") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "discordmessages_teamseasonid_fkey" FOREIGN KEY ("teamseasonid") REFERENCES "teamsseason"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "idx_discordmessages_accountid" ON "discordmessages" ("accountid");
CREATE INDEX "idx_discordmessages_seasonid" ON "discordmessages" ("seasonid");
CREATE INDEX "idx_discordmessages_channelid" ON "discordmessages" ("channelid");
CREATE INDEX "idx_discordmessages_postedat" ON "discordmessages" ("postedat");
