-- Add notification opt-out field to teams wanted classifieds
ALTER TABLE teamswantedclassified
ADD COLUMN IF NOT EXISTS notifyoptout BOOLEAN NOT NULL DEFAULT false;

-- Add index for efficient querying of users who want notifications
CREATE INDEX IF NOT EXISTS idx_teamswantedclassified_notify
ON teamswantedclassified(accountid, notifyoptout)
WHERE notifyoptout = false;
