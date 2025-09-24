'use client';

import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Block as BlockIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useAccount } from '../../context/AccountContext';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_SITE_NAME } from '../../lib/seoMetadata';

export const metadata: Metadata = {
  title: `Access Denied | ${DEFAULT_SITE_NAME}`,
  description:
    'You do not have permission to access this Draco Sports Manager page. Switch accounts or contact an administrator for additional access.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/unauthorized',
  },
  openGraph: {
    title: `Access Denied | ${DEFAULT_SITE_NAME}`,
    description:
      'You do not have permission to access this Draco Sports Manager page. Switch accounts or contact an administrator for additional access.',
    url: '/unauthorized',
    siteName: DEFAULT_SITE_NAME,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Access Denied | ${DEFAULT_SITE_NAME}`,
    description:
      'You do not have permission to access this Draco Sports Manager page. Switch accounts or contact an administrator for additional access.',
  },
};

function UnauthorizedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentAccount } = useAccount();
  const { user } = useAuth();

  const from = searchParams.get('from') || '';
  const required = searchParams.get('required') || '';

  const handleGoToAccountHome = () => {
    if (currentAccount) {
      router.push(`/account/${currentAccount.id}`);
    } else {
      router.push('/accounts');
    }
  };

  const handleGoToAccounts = () => {
    router.push('/accounts');
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          textAlign: 'center',
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'error.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BlockIcon sx={{ fontSize: 48, color: 'error.dark' }} />
          </Box>
        </Box>

        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Access Denied
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          You don&apos;t have permission to access this page.
        </Typography>

        {required && (
          <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="body2">
              <strong>Required:</strong>{' '}
              {required.startsWith('permission:')
                ? `${required.replace('permission:', '')} permission`
                : `${required.split(',').join(' or ')} role`}
            </Typography>
            {from && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Requested page:</strong> {from}
              </Typography>
            )}
          </Alert>
        )}

        <Divider sx={{ my: 3 }} />

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {user
            ? 'Please navigate to a page you have access to:'
            : 'Please sign in with an account that has the required permissions.'}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {currentAccount ? (
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<HomeIcon />}
              onClick={handleGoToAccountHome}
              fullWidth
            >
              Go to {currentAccount.name} Home
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<BusinessIcon />}
              onClick={handleGoToAccounts}
              fullWidth
            >
              Go to Account Selection
            </Button>
          )}

          <Button variant="outlined" color="primary" onClick={() => router.back()} fullWidth>
            Go Back
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 4, fontStyle: 'italic' }}>
          If you believe you should have access to this page, please contact your administrator.
        </Typography>
      </Paper>
    </Container>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <UnauthorizedContent />
    </Suspense>
  );
}
