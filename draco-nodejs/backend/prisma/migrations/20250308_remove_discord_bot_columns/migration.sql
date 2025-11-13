ALTER TABLE accountdiscordsettings
  DROP COLUMN IF EXISTS botuserid,
  DROP COLUMN IF EXISTS botusername,
  DROP COLUMN IF EXISTS bottokenencrypted;
