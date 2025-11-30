-- Remove duplicate registrations so the unique index can be created safely.
DELETE FROM "workoutregistration" wr
USING (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY workoutid, email
           ORDER BY dateregistered ASC, id ASC
         ) AS rn
  FROM "workoutregistration"
) dup
WHERE wr.id = dup.id
  AND dup.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS "uq_workoutregistration_workout_email"
  ON "workoutregistration"("workoutid", "email");
