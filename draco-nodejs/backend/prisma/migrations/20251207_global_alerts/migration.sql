-- System-wide alerts for broadcasting administrator messages to all accounts.
-- Guarded with IF NOT EXISTS so deploy remains idempotent if the table already exists.
CREATE TABLE IF NOT EXISTS "alerts" (
  "id" BIGSERIAL PRIMARY KEY,
  "message" VARCHAR(500) NOT NULL,
  "isactive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdat" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedat" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_alerts_isactive_createdat"
  ON "alerts" ("isactive", "createdat");
