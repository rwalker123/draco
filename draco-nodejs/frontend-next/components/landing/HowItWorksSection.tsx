'use client';

import { Box, Container, Paper, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SettingsIcon from '@mui/icons-material/Settings';
import GroupIcon from '@mui/icons-material/Group';
import SearchIcon from '@mui/icons-material/Search';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import NotificationsIcon from '@mui/icons-material/Notifications';

interface Step {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const adminSteps: Step[] = [
  {
    number: 1,
    icon: <PersonAddIcon />,
    title: 'Create Your Account',
    description: 'Sign up and set up your organization profile',
  },
  {
    number: 2,
    icon: <SettingsIcon />,
    title: 'Configure Your Seasons',
    description: 'Create leagues, teams, and schedules',
  },
  {
    number: 3,
    icon: <GroupIcon />,
    title: 'Engage Your Community',
    description: 'Share stats, photos, and announcements',
  },
];

const playerSteps: Step[] = [
  {
    number: 1,
    icon: <SearchIcon />,
    title: 'Find Your League',
    description: 'Search for your organization by name or location',
  },
  {
    number: 2,
    icon: <HowToRegIcon />,
    title: 'Join & Register',
    description: 'Create your profile and join your team',
  },
  {
    number: 3,
    icon: <NotificationsIcon />,
    title: 'Stay Connected',
    description: 'View schedules, stats, and updates',
  },
];

interface StepCardProps {
  step: Step;
}

function StepCard({ step }: StepCardProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          backgroundColor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontWeight: 600,
          fontSize: '1.25rem',
        }}
      >
        {step.number}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          {step.icon}
          <Typography variant="h6" component="h4" sx={{ fontWeight: 600 }}>
            {step.title}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {step.description}
        </Typography>
      </Box>
    </Box>
  );
}

export default function HowItWorksSection() {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography variant="h3" component="h2" sx={{ textAlign: 'center', mb: 6, fontWeight: 600 }}>
        How It Works
      </Typography>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 4, height: '100%' }}>
            <Typography
              variant="h4"
              component="h3"
              sx={{ textAlign: 'center', mb: 4, fontWeight: 600 }}
            >
              For League Administrators
            </Typography>
            {adminSteps.map((step) => (
              <StepCard key={step.number} step={step} />
            ))}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 4, height: '100%' }}>
            <Typography
              variant="h4"
              component="h3"
              sx={{ textAlign: 'center', mb: 4, fontWeight: 600 }}
            >
              For Players
            </Typography>
            {playerSteps.map((step) => (
              <StepCard key={step.number} step={step} />
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
