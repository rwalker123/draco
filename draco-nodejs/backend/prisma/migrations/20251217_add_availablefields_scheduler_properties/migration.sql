-- Add scheduler-related metadata to availablefields so the backend can enforce scheduling constraints.
ALTER TABLE availablefields
ADD COLUMN haslights BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN maxparallelgames INTEGER NOT NULL DEFAULT 1;
