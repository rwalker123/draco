-- Game line score: per-game inning-by-inning summary (runs by inning per team,
-- plus errors / optional hits override) stored as two JSONB columns, one per side.
-- Runs total and hits are derived on read (game result + batting stats), not stored.
CREATE TABLE gamelinescore (
  id BIGSERIAL PRIMARY KEY,
  gameid BIGINT NOT NULL,
  home JSONB,
  away JSONB,
  createdat TIMESTAMPTZ NOT NULL DEFAULT now(),
  updatedat TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_gamelinescore_leagueschedule
    FOREIGN KEY (gameid) REFERENCES leagueschedule(id) ON DELETE CASCADE,
  CONSTRAINT uq_gamelinescore_gameid
    UNIQUE (gameid)
);

CREATE INDEX idx_gamelinescore_gameid
  ON gamelinescore(gameid);
