-- Per-field scheduler start increment minutes (used when expanding field availability rules into concrete fieldSlots).
ALTER TABLE "availablefields"
  ADD COLUMN "schedulerstartincrementminutes" SMALLINT NOT NULL DEFAULT 165;

