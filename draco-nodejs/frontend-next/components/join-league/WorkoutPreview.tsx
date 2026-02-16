import React, { useEffect, useState } from 'react';
import { Box, Alert } from '@mui/material';
import { FitnessCenter } from '@mui/icons-material';
import SectionHeader from './SectionHeader';
import SectionCard from '../common/SectionCard';
import { WorkoutDisplay } from '../workouts/WorkoutDisplay';
import { listWorkouts } from '../../services/workoutService';
import { WorkoutSummaryType } from '@draco/shared-schemas';

interface WorkoutPreviewProps {
  accountId: string;
  token?: string;
  showViewAllWorkoutsButton?: boolean;
  onViewAllWorkouts?: () => void;
  maxDisplay?: number;
}

const WorkoutPreview: React.FC<WorkoutPreviewProps> = ({
  accountId,
  token,
  showViewAllWorkoutsButton = false,
  onViewAllWorkouts,
  maxDisplay = 3,
}) => {
  const [workouts, setWorkouts] = useState<WorkoutSummaryType[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchUpcomingWorkouts = async () => {
      try {
        setError(null);

        const upcomingWorkouts = await listWorkouts(accountId, false, token, 'upcoming', {
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        const upcoming = upcomingWorkouts
          .sort((a, b) => new Date(a.workoutDate).getTime() - new Date(b.workoutDate).getTime())
          .slice(0, maxDisplay);

        setWorkouts(upcoming);
      } catch (err: unknown) {
        if (controller.signal.aborted) {
          return;
        }
        console.error('Failed to fetch upcoming workouts:', err);
        setError('Failed to load workouts');
        setWorkouts([]);
      }
    };

    fetchUpcomingWorkouts();

    return () => {
      controller.abort();
    };
  }, [accountId, token, maxDisplay]);

  if (!error && workouts.length === 0) {
    return null;
  }

  const actionButton =
    showViewAllWorkoutsButton && onViewAllWorkouts
      ? { label: 'View All Workouts', onClick: onViewAllWorkouts }
      : undefined;

  const content = error ? (
    <Alert severity="error" sx={{ mt: 2 }}>
      {error}
    </Alert>
  ) : (
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
            showRegistrationButton
            compact
          />
        </Box>
      ))}
    </Box>
  );

  return (
    <Box
      sx={{
        gridColumn: {
          xs: '1',
          md: 'span 2',
          lg: '1',
        },
      }}
    >
      <SectionCard hover={!error}>
        <SectionHeader
          icon={<FitnessCenter />}
          title="Upcoming Workouts"
          description="Enhance your chances to get on a team by registering for upcoming workouts."
          actionButton={actionButton}
        />
        {content}
      </SectionCard>
    </Box>
  );
};

export default WorkoutPreview;
