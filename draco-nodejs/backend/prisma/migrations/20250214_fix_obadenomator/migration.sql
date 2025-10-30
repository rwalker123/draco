ALTER TABLE batstatsum
  DROP COLUMN obadenominator;

ALTER TABLE batstatsum
  ADD COLUMN obadenominator integer
    GENERATED ALWAYS AS ((ab + bb) + hbp + sf) STORED;