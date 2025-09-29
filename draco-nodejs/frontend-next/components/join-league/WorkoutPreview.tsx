import React, { useEffect, useState } from 'react';
import { Box, Skeleton, Alert } from '@mui/material';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchUpcomingWorkouts = async () => {
      try {
        setLoading(true);
        setError(null);

        const allWorkouts = await listWorkouts(accountId, false, token);
        if (!isMounted) {
          return;
        }

        const now = new Date();
        const upcoming = allWorkouts
          .filter((workout) => new Date(workout.workoutDate) > now)
          .sort((a, b) => new Date(a.workoutDate).getTime() - new Date(b.workoutDate).getTime())
          .slice(0, maxDisplay);

        setWorkouts(upcoming);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        console.error('Failed to fetch upcoming workouts:', err);
        setError('Failed to load workouts');
        setWorkouts([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUpcomingWorkouts();

    return () => {
      isMounted = false;
    };
  }, [accountId, token, maxDisplay]);

  if (loading) {
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
        <SectionCard hover={false}>
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
            }}
          >
            {Array.from({ length: maxDisplay }).map((_, index) => (
              <Skeleton key={index} variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
            ))}
          </Box>
        </SectionCard>
      </Box>
    );
  }

  if (error) {
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
        <SectionCard hover={false}>
          <SectionHeader
            icon={<FitnessCenter />}
            title="Training & Tryouts"
            description="Register for upcoming workouts and training sessions"
          />
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        </SectionCard>
      </Box>
    );
  }

  if (workouts.length === 0) {
    return null;
  }

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
      <SectionCard>
        <SectionHeader
          icon={<FitnessCenter />}
          title="Training & Tryouts"
          description="Register for upcoming workouts and training sessions"
          actionButton={
            showViewAllWorkoutsButton && onViewAllWorkouts
              ? { label: 'View All Workouts', onClick: onViewAllWorkouts }
              : undefined
          }
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
                showRegistrationButton
                compact
              />
            </Box>
          ))}
        </Box>
      </SectionCard>
    </Box>
  );
};

export default WorkoutPreview;
