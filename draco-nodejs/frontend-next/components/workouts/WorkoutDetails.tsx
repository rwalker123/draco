'use client';

import React from 'react';
import { Container, Breadcrumbs, Link, Typography, Box } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Home, NavigateNext } from '@mui/icons-material';
import AccountPageHeader from '../AccountPageHeader';
import { WorkoutDisplay } from './WorkoutDisplay';

export const WorkoutDetails: React.FC = () => {
  const { accountId, workoutId } = useParams();
  const { token } = useAuth();
  const router = useRouter();

  return (
    <main className="min-h-screen bg-background">
      <AccountPageHeader accountId={accountId as string}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
            Preview Workout
          </Typography>
        </Box>
      </AccountPageHeader>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Breadcrumb Navigation */}
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs separator={<NavigateNext fontSize="small" />} aria-label="breadcrumb">
            <Link
              component="button"
              variant="body2"
              color="inherit"
              onClick={() => router.push(`/account/${accountId}/workouts`)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              <Home fontSize="small" />
              Workouts
            </Link>
            <Typography variant="body2" color="text.primary">
              Preview
            </Typography>
          </Breadcrumbs>
        </Box>

        {/* Workout Display */}
        <WorkoutDisplay
          accountId={accountId as string}
          workoutId={workoutId as string}
          token={token || undefined}
          showRegistrationButton={true}
          compact={false}
        />
      </Container>
    </main>
  );
};
