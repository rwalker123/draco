-- Lowercase all existing usernames for case-insensitive uniqueness
UPDATE "aspnetusers" SET username = LOWER(username) WHERE username IS NOT NULL;

-- Create unique index on lowercase username to prevent case-variant duplicates
CREATE UNIQUE INDEX IF NOT EXISTS "uq_aspnetusers_username_lower" ON "aspnetusers" (LOWER(username));
