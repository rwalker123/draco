-- System-wide alerts for broadcasting administrator messages to all accounts.
CREATE TABLE "alerts" (
  "id" BIGSERIAL PRIMARY KEY,
  "message" VARCHAR(500) NOT NULL,
  "isactive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdat" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedat" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_alerts_isactive_createdat"
  ON "alerts" ("isactive", "createdat");
