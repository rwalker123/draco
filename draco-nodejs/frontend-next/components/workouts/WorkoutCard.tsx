'use client';

import React from 'react';
import { Card, CardContent, Typography, Button, Box, Chip, CardActions } from '@mui/material';
import { CalendarToday, LocationOn } from '@mui/icons-material';
import { WorkoutSummary } from '../../types/workouts';

interface WorkoutCardProps {
  workout: WorkoutSummary;
  onRegister?: () => void;
  showRegisterButton?: boolean;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workout,
  onRegister,
  showRegisterButton = true,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  if (!isUpcoming(workout.workoutDate)) {
    return null; // Don't show past workouts
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="h3" gutterBottom>
          {workout.workoutDesc}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <CalendarToday sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {formatDate(workout.workoutDate)} at {formatTime(workout.workoutDate)}
          </Typography>
        </Box>

        {workout.fieldId && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              Field {workout.fieldId}
            </Typography>
          </Box>
        )}

        <Chip label="Upcoming" color="primary" size="small" sx={{ mt: 1 }} />
      </CardContent>

      {showRegisterButton && onRegister && (
        <CardActions>
          <Button variant="contained" color="primary" fullWidth onClick={onRegister}>
            Register Now
          </Button>
        </CardActions>
      )}
    </Card>
  );
};
