-- AddEmailBounceTracking
ALTER TABLE contacts ADD COLUMN email_bounced_at TIMESTAMP(3);

ALTER TABLE emails ADD COLUMN skipped_count INTEGER NOT NULL DEFAULT 0;
