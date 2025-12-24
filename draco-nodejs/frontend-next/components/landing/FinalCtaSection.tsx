'use client';

import { Box, Button, Container, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

interface FinalCtaSectionProps {
  onSignUp: () => void;
  onContact: () => void;
  isAuthenticated: boolean;
}

export default function FinalCtaSection({
  onSignUp,
  onContact,
  isAuthenticated,
}: FinalCtaSectionProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: alpha(theme.palette.primary.light, 0.1),
        py: 8,
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
            Ready to Transform Your League?
          </Typography>
          <Typography
            variant="body1"
            sx={{ mb: 4, color: 'text.secondary', maxWidth: '600px', mx: 'auto' }}
          >
            Join thousands of organizations already using ezRecSports to manage their leagues.
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
            {!isAuthenticated && (
              <Button
                variant="contained"
                size="large"
                onClick={onSignUp}
                sx={{ minWidth: { xs: '200px', sm: '160px' } }}
              >
                Get Started Free
              </Button>
            )}
            <Button
              variant="outlined"
              size="large"
              onClick={onContact}
              sx={{ minWidth: { xs: '200px', sm: '160px' } }}
            >
              Contact Us
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
