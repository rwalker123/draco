'use client';

// Verify Classified Page Content
// Handles access code verification for Teams Wanted classifieds via email links

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Container,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Button,
} from '@mui/material';
import { Check as CheckIcon, Error as ErrorIcon } from '@mui/icons-material';
import AccountPageHeader from '../../../../../components/AccountPageHeader';
import { validateAccessCode } from '../../../../../utils/accessCodeValidation';

interface VerifyClassifiedProps {
  accountId: string;
  classifiedId: string;
}

interface VerificationState {
  loading: boolean;
  success: boolean;
  error: string | null;
  classifiedData: {
    name: string;
    email: string;
    experience: string;
    [key: string]: unknown;
  } | null;
}

const VerifyClassified: React.FC<VerifyClassifiedProps> = ({ accountId, classifiedId }) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const accessCode = searchParams.get('code');

  const [state, setState] = useState<VerificationState>({
    loading: true,
    success: false,
    error: null,
    classifiedData: null,
  });

  useEffect(() => {
    const verifyAccess = async () => {
      // Validate required parameters
      if (!accessCode) {
        setState({
          loading: false,
          success: false,
          error: 'Invalid verification link. Access code is missing.',
          classifiedData: null,
        });
        return;
      }

      // Validate access code format
      const validation = validateAccessCode(accessCode);
      if (!validation.isValid) {
        setState({
          loading: false,
          success: false,
          error: `Invalid access code format: ${validation.error}`,
          classifiedData: null,
        });
        return;
      }

      try {
        // Make API request to verify access
        const response = await fetch(
          `/api/accounts/${accountId}/player-classifieds/teams-wanted/${classifiedId}/verify`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              accessCode: validation.sanitizedValue,
            }),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Verification failed');
        }

        const classified = await response.json();
        setState({
          loading: false,
          success: true,
          error: null,
          classifiedData: classified,
        });

        // Store verification success and access code for secure redirect
        const verificationData = {
          accountId,
          accessCode: validation.sanitizedValue,
          timestamp: Date.now(),
          classifiedData: classified,
        };
        localStorage.setItem('teamsWantedVerification', JSON.stringify(verificationData));

        // Redirect to Teams Wanted tab without exposing classified ID
        setTimeout(() => {
          router.push(`/account/${accountId}/player-classifieds?tab=teams-wanted`);
        }, 3000);
      } catch (error) {
        setState({
          loading: false,
          success: false,
          error: error instanceof Error ? error.message : 'Verification failed',
          classifiedData: null,
        });
      }
    };

    verifyAccess();
  }, [accountId, classifiedId, accessCode, router]);

  const handleRetry = () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    // Trigger re-verification by reloading
    window.location.reload();
  };

  const handleGoToClassifieds = () => {
    router.push(`/account/${accountId}/player-classifieds`);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Account Header */}
      <AccountPageHeader accountId={accountId}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Typography variant="h4" component="h1" gutterBottom>
            Verify Teams Wanted Access
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Verifying your access code from email
          </Typography>
        </Box>
      </AccountPageHeader>

      {/* Main Content */}
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            {state.loading && (
              <Box>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Verifying Access Code...
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Please wait while we verify your access code.
                </Typography>
              </Box>
            )}

            {state.success && (
              <Box>
                <CheckIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom color="success.main">
                  Access Verified Successfully!
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Your Teams Wanted classified has been verified. You will be redirected to view it
                  shortly.
                </Typography>
                {state.classifiedData && (
                  <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Classified Details:
                    </Typography>
                    <Typography variant="body2">
                      Name: {state.classifiedData.name}
                      <br />
                      Email: {state.classifiedData.email}
                      <br />
                      Experience: {state.classifiedData.experience}
                    </Typography>
                  </Alert>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                  Redirecting in 3 seconds...
                </Typography>
              </Box>
            )}

            {state.error && (
              <Box>
                <ErrorIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom color="error.main">
                  Verification Failed
                </Typography>
                <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                  {state.error}
                </Alert>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button variant="outlined" onClick={handleRetry}>
                    Try Again
                  </Button>
                  <Button variant="contained" onClick={handleGoToClassifieds}>
                    Go to Classifieds
                  </Button>
                </Box>

                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Troubleshooting:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Make sure you clicked the link from your email
                    <br />
                    • Check that the access code is complete and unmodified
                    <br />
                    • Ensure the link hasn&apos;t expired
                    <br />• Contact support if the problem persists
                  </Typography>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </main>
  );
};

export default VerifyClassified;
