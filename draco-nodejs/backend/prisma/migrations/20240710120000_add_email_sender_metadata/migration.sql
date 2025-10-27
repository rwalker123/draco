ALTER TABLE "emails"
    ADD COLUMN "sender_contact_id" BIGINT,
    ADD COLUMN "sender_contact_name" VARCHAR(255),
    ADD COLUMN "reply_to_email" VARCHAR(320),
    ADD COLUMN "from_name_override" VARCHAR(255);

ALTER TABLE "emails"
    ADD CONSTRAINT "emails_sender_contact_id_fkey"
    FOREIGN KEY ("sender_contact_id")
    REFERENCES "contacts"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;

CREATE INDEX "emails_sender_contact_id_idx" ON "emails" ("sender_contact_id");
