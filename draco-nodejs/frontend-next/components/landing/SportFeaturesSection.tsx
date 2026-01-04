'use client';

import { Box, Button, Chip, Container, Paper, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import SportsBaseballIcon from '@mui/icons-material/SportsBaseball';
import GolfCourseIcon from '@mui/icons-material/GolfCourse';
import CheckIcon from '@mui/icons-material/Check';

interface Feature {
  text: string;
}

const baseballFeatures: Feature[] = [
  { text: 'Game scheduling and scorekeeping' },
  { text: 'Batting and pitching statistics' },
  { text: 'Team standings and playoffs' },
  { text: 'Player profiles and career stats' },
  { text: 'Photo galleries and game recaps' },
];

const golfFeatures: Feature[] = [
  { text: 'Personal score tracking' },
  { text: 'Handicap calculation' },
  { text: 'Course scorecards' },
  { text: 'Statistics and insights' },
];

interface FeatureListProps {
  features: Feature[];
  disabled?: boolean;
}

function FeatureList({ features, disabled = false }: FeatureListProps) {
  return (
    <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
      {features.map((feature) => (
        <Box
          key={feature.text}
          component="li"
          aria-disabled={disabled || undefined}
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.5,
            mb: 2,
            opacity: disabled ? 0.6 : 1,
          }}
        >
          <CheckIcon sx={{ color: 'success.main', flexShrink: 0, mt: 0.25 }} />
          <Typography variant="body1">{feature.text}</Typography>
        </Box>
      ))}
    </Box>
  );
}

interface SportFeaturesSectionProps {
  onGolfGetStarted?: () => void;
}

export default function SportFeaturesSection({ onGolfGetStarted }: SportFeaturesSectionProps) {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 4, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <SportsBaseballIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Typography variant="h4" component="h3" sx={{ fontWeight: 600 }}>
                Baseball
              </Typography>
            </Box>
            <Chip label="Available Now" color="success" sx={{ mb: 3 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              For leagues and organizations
            </Typography>
            <FeatureList features={baseballFeatures} />
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 4, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <GolfCourseIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Typography variant="h4" component="h3" sx={{ fontWeight: 600 }}>
                Golf
              </Typography>
            </Box>
            <Chip label="Available Now" color="success" sx={{ mb: 3 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              For individual golfers
            </Typography>
            <FeatureList features={golfFeatures} />
            {onGolfGetStarted && (
              <Box sx={{ mt: 3 }}>
                <Button variant="contained" color="primary" onClick={onGolfGetStarted}>
                  Get Started
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
