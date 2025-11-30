'use client';

import { Alert, Box } from '@mui/material';
import { useParams } from 'next/navigation';
import { WorkoutDisplay } from '@/components/workouts/WorkoutDisplay';

const WorkoutDetailsClientWrapper = () => {
  const params = useParams();
  const accountId = Array.isArray(params.accountId) ? params.accountId[0] : params.accountId;
  const workoutId = Array.isArray(params.workoutId) ? params.workoutId[0] : params.workoutId;

  if (!accountId || !workoutId) {
    return (
      <Box sx={{ py: 6 }}>
        <Alert severity="error">Workout not found.</Alert>
      </Box>
    );
  }

  return (
    <Box component="main" sx={{ py: 4 }}>
      <WorkoutDisplay
        accountId={accountId}
        workoutId={workoutId}
        showRegistrationButton
        compact={false}
      />
    </Box>
  );
};

export default WorkoutDetailsClientWrapper;

