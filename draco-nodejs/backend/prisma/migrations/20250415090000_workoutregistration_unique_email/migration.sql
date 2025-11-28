CREATE UNIQUE INDEX IF NOT EXISTS "uq_workoutregistration_workout_email"
  ON "workoutregistration"("workoutid", "email");
