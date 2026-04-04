CREATE TABLE golfclosesttopin (
  id BIGSERIAL PRIMARY KEY,
  matchid BIGINT NOT NULL,
  holeno INT NOT NULL,
  contactid BIGINT NOT NULL,
  distance FLOAT NOT NULL,
  unit VARCHAR(5) NOT NULL DEFAULT 'ft',
  enteredby VARCHAR(128) NOT NULL,
  enteredat TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_golfclosesttopin_golfmatch FOREIGN KEY (matchid) REFERENCES golfmatch(id) ON DELETE CASCADE,
  CONSTRAINT fk_golfclosesttopin_contacts FOREIGN KEY (contactid) REFERENCES contacts(id) ON DELETE CASCADE,
  CONSTRAINT fk_golfclosesttopin_aspnetusers FOREIGN KEY (enteredby) REFERENCES aspnetusers(id) ON DELETE CASCADE,
  CONSTRAINT uq_golfclosesttopin_match_hole UNIQUE (matchid, holeno)
);

CREATE INDEX idx_golfclosesttopin_match ON golfclosesttopin(matchid);
