'use client';

import Link from 'next/link';
import { Box, Button, Stack, Typography } from '@mui/material';
import { DEFAULT_SITE_NAME } from '@/lib/seoMetadata';

const NotFoundPage: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 6,
      }}
    >
      <Stack spacing={3} alignItems="center" textAlign="center" sx={{ maxWidth: 560 }}>
        <Typography
          variant="overline"
          sx={{ letterSpacing: 2, color: 'text.secondary', textTransform: 'uppercase' }}
        >
          404 | Not Found
        </Typography>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 800 }}>
          This page stepped out
        </Typography>
        <Typography variant="body1" color="text.secondary">
          We couldn&apos;t find this route inside {DEFAULT_SITE_NAME}. It may have moved or you may
          need different access.
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          width="100%"
          justifyContent="center"
        >
          <Button
            component={Link}
            href="/"
            variant="contained"
            color="primary"
            size="large"
            fullWidth
          >
            Go to Home
          </Button>
          <Button component={Link} href="/accounts" variant="outlined" size="large" fullWidth>
            View Accounts
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default NotFoundPage;
