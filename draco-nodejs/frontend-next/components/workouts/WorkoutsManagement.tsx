'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import AccountPageHeader from '../AccountPageHeader';
import { WorkoutRegistrationsAccordion } from './WorkoutRegistrationsAccordion';

interface WorkoutsManagementProps {
  accountId: string;
}

export const WorkoutsManagement: React.FC<WorkoutsManagementProps> = ({ accountId }) => {
  const router = useRouter();

  const handleCreateWorkout = () => {
    router.push(`/account/${accountId}/workouts/new`);
  };

  const handleManageSources = () => {
    router.push(`/account/${accountId}/workouts/sources`);
  };

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
              Workouts Management
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={handleManageSources}
              sx={{
                color: 'white',
                borderColor: 'white',
                '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Manage Where Heard
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateWorkout}
              sx={{
                backgroundColor: 'white',
                color: 'primary.main',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' },
              }}
            >
              Create Workout
            </Button>
          </Box>
        </Box>
      </AccountPageHeader>

      {/* Use the new accordion component */}
      <WorkoutRegistrationsAccordion accountId={accountId} />
    </main>
  );
};
