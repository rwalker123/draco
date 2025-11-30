-- Make email_recipients.contact_id nullable to support non-contact recipients
ALTER TABLE "email_recipients"
ALTER COLUMN "contact_id" DROP NOT NULL;
