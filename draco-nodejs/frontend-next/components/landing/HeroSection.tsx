'use client';

import { Box, Button, Container, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface HeroSectionProps {
  onSignUp: () => void;
  onFindLeague: () => void;
  isAuthenticated: boolean;
}

export default function HeroSection({
  onSignUp: _onSignUp,
  onFindLeague,
  isAuthenticated: _isAuthenticated,
}: HeroSectionProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: '100%',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        minHeight: { xs: '400px', md: '500px' },
        display: 'flex',
        alignItems: 'center',
        py: { xs: 6, md: 8 },
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', color: 'white' }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' }, fontWeight: 700, mb: 2 }}
          >
            ezRecSports
          </Typography>
          <Typography
            variant="h5"
            component="h2"
            sx={{
              fontSize: { xs: '1.25rem', md: '1.5rem' },
              fontWeight: 500,
              mb: 3,
              opacity: 0.9,
            }}
          >
            The complete platform for managing your sports organization
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1rem', md: '1.125rem' },
              mb: 4,
              opacity: 0.8,
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            Streamline registration, scheduling, communication, and more with our all-in-one sports
            management solution.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* TODO: Re-enable Get Started button
            <Button
              variant="contained"
              size="large"
              onClick={onSignUp}
              sx={{
                backgroundColor: 'white',
                color: theme.palette.primary.main,
                minWidth: { xs: '200px', sm: '160px' },
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' },
              }}
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
            </Button>
            */}
            <Button
              variant="outlined"
              size="large"
              onClick={onFindLeague}
              sx={{
                borderColor: 'white',
                color: 'white',
                minWidth: { xs: '200px', sm: '160px' },
                '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255, 255, 255, 0.1)' },
              }}
            >
              Find a League
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
