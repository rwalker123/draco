ALTER TABLE emails ADD COLUMN team_season_id BIGINT NULL;

ALTER TABLE emails
  ADD CONSTRAINT fk_emails_teamsseason
  FOREIGN KEY (team_season_id)
  REFERENCES teamsseason(id)
  ON DELETE SET NULL;

CREATE INDEX idx_emails_account_team_season_created ON emails(account_id, team_season_id, created_at DESC);
