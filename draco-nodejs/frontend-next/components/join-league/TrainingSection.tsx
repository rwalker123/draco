import React from 'react';
import { Box } from '@mui/material';
import { FitnessCenter } from '@mui/icons-material';
import SectionHeader from './SectionHeader';
import SectionCard from '../common/SectionCard';
import { WorkoutDisplay } from '../workouts/WorkoutDisplay';
import { WorkoutSummary } from '../../types/workouts';

interface TrainingSectionProps {
  workouts: WorkoutSummary[];
  accountId: string;
  token?: string;
}

const TrainingSection: React.FC<TrainingSectionProps> = ({ workouts, accountId, token }) => {
  if (workouts.length === 0) {
    return null;
  }

  return (
    <SectionCard>
      <SectionHeader
        icon={<FitnessCenter />}
        title="Training & Tryouts"
        description="Register for upcoming workouts and training sessions"
      />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(auto-fit, minmax(300px, 1fr))',
          },
          gap: 3,
          flex: 1,
        }}
      >
        {workouts.map((workout) => (
          <Box key={workout.id}>
            <WorkoutDisplay
              accountId={accountId}
              workoutId={workout.id}
              token={token}
              showRegistrationButton={true}
              compact={true}
            />
          </Box>
        ))}
      </Box>
    </SectionCard>
  );
};

export default TrainingSection;
