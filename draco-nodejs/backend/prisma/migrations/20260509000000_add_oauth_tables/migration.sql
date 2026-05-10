-- CreateTable
CREATE TABLE "oauth_client" (
    "client_id"                      VARCHAR(64)  NOT NULL,
    "name"                           VARCHAR(255) NOT NULL,
    "client_secret_hash"             VARCHAR(64),
    "hash_version"                   SMALLINT     NOT NULL DEFAULT 1,
    "redirect_uris"                  TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
    "grant_types"                    TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
    "scopes"                         TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
    "token_endpoint_auth_method"     VARCHAR(32)  NOT NULL,
    "registration_access_token_hash" VARCHAR(64)  NOT NULL,
    "registered_by_user_id"          VARCHAR(128),
    "software_id"                    VARCHAR(128),
    "software_version"               VARCHAR(64),
    "disabled_at"                    TIMESTAMPTZ(6),
    "created_at"                     TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"                     TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_client_pkey" PRIMARY KEY ("client_id"),
    CONSTRAINT "chk_oauth_client_grant_types"           CHECK (array_length(grant_types, 1) >= 1),
    CONSTRAINT "chk_oauth_client_redirect_uris"         CHECK (array_length(redirect_uris, 1) >= 1),
    CONSTRAINT "chk_oauth_client_token_endpoint_auth"   CHECK (token_endpoint_auth_method IN ('none', 'client_secret_basic', 'client_secret_post'))
);

CREATE INDEX "idx_oauth_client_created_at" ON "oauth_client" ("created_at" DESC);

ALTER TABLE "oauth_client"
    ADD CONSTRAINT "fk_oauth_client_aspnetusers"
    FOREIGN KEY ("registered_by_user_id") REFERENCES "aspnetusers"("id") ON DELETE SET NULL;

ALTER TABLE "oauth_client" SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.02);

-- CreateTable
CREATE TABLE "oauth_authorization_code" (
    "code_hash"             CHAR(64)       NOT NULL,
    "hash_version"          SMALLINT       NOT NULL DEFAULT 1,
    "client_id"             VARCHAR(64)    NOT NULL,
    "user_id"               VARCHAR(128)   NOT NULL,
    "redirect_uri"          VARCHAR(2048)  NOT NULL,
    "scopes"                TEXT[]         NOT NULL DEFAULT ARRAY[]::TEXT[],
    "code_challenge"        VARCHAR(128)   NOT NULL,
    "code_challenge_method" VARCHAR(8)     NOT NULL,
    "resource"              VARCHAR(2048),
    "expires_at"            TIMESTAMPTZ(6) NOT NULL,
    "consumed_at"           TIMESTAMPTZ(6),
    "created_at"            TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_authorization_code_pkey" PRIMARY KEY ("code_hash"),
    CONSTRAINT "chk_oauth_auth_code_challenge_method" CHECK (code_challenge_method IN ('S256', 'plain'))
);

CREATE INDEX "idx_oauth_auth_code_expires_at" ON "oauth_authorization_code" ("expires_at");

ALTER TABLE "oauth_authorization_code"
    ADD CONSTRAINT "fk_oauth_auth_code_client"
    FOREIGN KEY ("client_id") REFERENCES "oauth_client"("client_id") ON DELETE CASCADE,
    ADD CONSTRAINT "fk_oauth_auth_code_aspnetusers"
    FOREIGN KEY ("user_id") REFERENCES "aspnetusers"("id") ON DELETE CASCADE;

ALTER TABLE "oauth_authorization_code" SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.02);

-- CreateTable
CREATE TABLE "oauth_access_token" (
    "jti"               UUID           NOT NULL,
    "client_id"         VARCHAR(64)    NOT NULL,
    "user_id"           VARCHAR(128)   NOT NULL,
    "scopes"            TEXT[]         NOT NULL DEFAULT ARRAY[]::TEXT[],
    "audience"          VARCHAR(128)   NOT NULL,
    "security_stamp"    VARCHAR(128),
    "issued_at"         TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at"        TIMESTAMPTZ(6) NOT NULL,
    "revoked_at"        TIMESTAMPTZ(6),
    "revocation_reason" VARCHAR(64),

    CONSTRAINT "oauth_access_token_pkey" PRIMARY KEY ("jti")
);

CREATE INDEX "idx_oauth_access_token_client_expires"  ON "oauth_access_token" ("client_id", "expires_at");
CREATE INDEX "idx_oauth_access_token_expires_at"       ON "oauth_access_token" ("expires_at");
CREATE INDEX "idx_oauth_access_token_user_active"      ON "oauth_access_token" ("user_id") WHERE revoked_at IS NULL;

ALTER TABLE "oauth_access_token"
    ADD CONSTRAINT "fk_oauth_access_token_client"
    FOREIGN KEY ("client_id") REFERENCES "oauth_client"("client_id") ON DELETE CASCADE,
    ADD CONSTRAINT "fk_oauth_access_token_aspnetusers"
    FOREIGN KEY ("user_id") REFERENCES "aspnetusers"("id") ON DELETE CASCADE;

ALTER TABLE "oauth_access_token" SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.02);

-- CreateTable
CREATE TABLE "oauth_refresh_token" (
    "token_hash"               CHAR(64)       NOT NULL,
    "hash_version"             SMALLINT       NOT NULL DEFAULT 1,
    "chain_id"                 UUID           NOT NULL,
    "parent_jti"               UUID,
    "current_access_token_jti" UUID,
    "client_id"                VARCHAR(64)    NOT NULL,
    "user_id"                  VARCHAR(128)   NOT NULL,
    "scopes"                   TEXT[]         NOT NULL DEFAULT ARRAY[]::TEXT[],
    "audience"                 VARCHAR(128)   NOT NULL,
    "issued_at"                TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at"               TIMESTAMPTZ(6) NOT NULL,
    "revoked_at"               TIMESTAMPTZ(6),
    "revocation_reason"        VARCHAR(64),

    CONSTRAINT "oauth_refresh_token_pkey" PRIMARY KEY ("token_hash")
);

CREATE INDEX "idx_oauth_refresh_token_chain_id"   ON "oauth_refresh_token" ("chain_id");
CREATE INDEX "idx_oauth_refresh_token_parent_jti" ON "oauth_refresh_token" ("parent_jti");
CREATE INDEX "idx_oauth_refresh_token_expires_at" ON "oauth_refresh_token" ("expires_at");
CREATE INDEX "idx_oauth_refresh_token_user_active" ON "oauth_refresh_token" ("user_id") WHERE revoked_at IS NULL;

ALTER TABLE "oauth_refresh_token"
    ADD CONSTRAINT "fk_oauth_refresh_token_client"
    FOREIGN KEY ("client_id") REFERENCES "oauth_client"("client_id") ON DELETE CASCADE,
    ADD CONSTRAINT "fk_oauth_refresh_token_aspnetusers"
    FOREIGN KEY ("user_id") REFERENCES "aspnetusers"("id") ON DELETE CASCADE;

ALTER TABLE "oauth_refresh_token" SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.02);

-- CreateTable
CREATE TABLE "oauth_consent_request" (
    "rid"                   UUID           NOT NULL,
    "client_id"             VARCHAR(64)    NOT NULL,
    "user_id"               VARCHAR(128)   NOT NULL,
    "redirect_uri"          VARCHAR(2048)  NOT NULL,
    "scopes"                TEXT[]         NOT NULL DEFAULT ARRAY[]::TEXT[],
    "state"                 VARCHAR(2048),
    "code_challenge"        VARCHAR(128)   NOT NULL,
    "code_challenge_method" VARCHAR(8)     NOT NULL,
    "resource"              VARCHAR(2048),
    "expires_at"            TIMESTAMPTZ(6) NOT NULL,
    "consumed_at"           TIMESTAMPTZ(6),
    "created_at"            TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_consent_request_pkey" PRIMARY KEY ("rid"),
    CONSTRAINT "chk_oauth_consent_request_challenge_method" CHECK (code_challenge_method IN ('S256', 'plain'))
);

CREATE INDEX "idx_oauth_consent_request_expires_at" ON "oauth_consent_request" ("expires_at");

ALTER TABLE "oauth_consent_request"
    ADD CONSTRAINT "fk_oauth_consent_request_client"
    FOREIGN KEY ("client_id") REFERENCES "oauth_client"("client_id") ON DELETE CASCADE,
    ADD CONSTRAINT "fk_oauth_consent_request_aspnetusers"
    FOREIGN KEY ("user_id") REFERENCES "aspnetusers"("id") ON DELETE CASCADE;

ALTER TABLE "oauth_consent_request" SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.02);
