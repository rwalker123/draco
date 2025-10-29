-- Create sequences if missing and tie ownership to the columns
CREATE SEQUENCE IF NOT EXISTS batstatsum_id_seq OWNED BY batstatsum.id;
CREATE SEQUENCE IF NOT EXISTS pitchstatsum_id_seq OWNED BY pitchstatsum.id;

-- Ensure the ID columns use their sequences
ALTER TABLE batstatsum
  ALTER COLUMN id SET DEFAULT nextval('batstatsum_id_seq');

ALTER TABLE pitchstatsum
  ALTER COLUMN id SET DEFAULT nextval('pitchstatsum_id_seq');

-- Sync sequences to the current max IDs
SELECT setval('batstatsum_id_seq', (SELECT COALESCE(MAX(id), 0) FROM batstatsum) + 1);
SELECT setval('pitchstatsum_id_seq', (SELECT COALESCE(MAX(id), 0) FROM pitchstatsum) + 1);
