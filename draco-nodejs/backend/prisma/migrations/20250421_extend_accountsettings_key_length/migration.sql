-- Extend setting key length to accommodate new Bluesky announcement setting
ALTER TABLE "accountsettings" ALTER COLUMN "settingkey" TYPE VARCHAR(40);
