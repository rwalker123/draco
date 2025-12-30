-- Add notification opt-out field to players wanted classifieds
ALTER TABLE playerswantedclassified
ADD COLUMN IF NOT EXISTS notifyoptout BOOLEAN NOT NULL DEFAULT false;

-- Add index for efficient querying of users who want notifications
CREATE INDEX IF NOT EXISTS idx_playerswantedclassified_notify
ON playerswantedclassified(accountid, notifyoptout)
WHERE notifyoptout = false;
