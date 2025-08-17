import { useState, useEffect, useCallback } from 'react';
import { Box, Button, CircularProgress, Alert, Typography } from '@mui/material';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';

import { EmailComposePage } from '../../../../../components/emails/compose';
import { useEmailRecipients, useCurrentSeason } from '../../../../../hooks/useEmailRecipients';
import { EmailComposeRequest } from '../../../../../types/emails/email';

export default function EmailCompose() {
  const { accountId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get current season for context
  const {
    currentSeason,
    isLoading: seasonLoading,
    error: seasonError,
  } = useCurrentSeason(accountId as string);

  // Load email recipient data
  const {
    contacts,
    teamGroups,
    roleGroups,
    isLoading: recipientsLoading,
    error: recipientsError,
    refresh: refreshRecipients,
  } = useEmailRecipients(accountId as string, currentSeason?.id);

  const [initialData, setInitialData] = useState<Partial<EmailComposeRequest> | undefined>();

  // Combined loading and error states
  const loading = seasonLoading || recipientsLoading;
  const error = seasonError || recipientsError;

  // Load initial compose data from URL parameters
  const loadInitialData = useCallback(() => {
    // Check for initial data from URL params (reply, forward, template, etc.)
    const templateId = searchParams.get('template');
    const subject = searchParams.get('subject');
    const body = searchParams.get('body');

    let composeInitialData: Partial<EmailComposeRequest> | undefined;
    if (subject || body || templateId) {
      composeInitialData = {
        subject: subject || '',
        body: body || '',
        templateId: templateId || undefined,
      };
    }

    setInitialData(composeInitialData);
  }, [searchParams]);

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    router.push(`/account/${accountId}/communications`);
  }, [router, accountId]);

  // Handle send completion
  const handleSendComplete = useCallback(
    (emailId: string) => {
      // Navigate back to communications page or show success message
      router.push(`/account/${accountId}/communications?sent=${emailId}`);
    },
    [router, accountId],
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    router.push(`/account/${accountId}/communications`);
  }, [router, accountId]);

  // Show loading state
  if (loading) {
    return (
      <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
        <main className="min-h-screen bg-background">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '50vh',
              gap: 2,
            }}
          >
            <CircularProgress size={48} />
            <Typography variant="body1" color="text.secondary">
              Loading email composer...
            </Typography>
          </Box>
        </main>
      </ProtectedRoute>
    );
  }

  // Show error state
  if (error) {
    return (
      <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
        <main className="min-h-screen bg-background">
          <Box sx={{ p: 3 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
              Back to Communications
            </Button>

            <Alert
              severity="error"
              action={
                <Button size="small" onClick={refreshRecipients}>
                  Retry
                </Button>
              }
            >
              <Typography variant="h6">Failed to Load</Typography>
              <Typography variant="body2">
                {typeof error === 'string' ? error : error?.userMessage || 'An error occurred'}
              </Typography>
            </Alert>
          </Box>
        </main>
      </ProtectedRoute>
    );
  }

  // Render the complete email compose interface
  return (
    <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
      <main className="min-h-screen bg-background">
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* Navigation Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Button startIcon={<ArrowBackIcon />} onClick={handleBack} size="small" color="inherit">
              Back to Communications
            </Button>
          </Box>

          {/* Main Compose Interface */}
          <Box sx={{ flex: 1 }}>
            <EmailComposePage
              accountId={accountId as string}
              initialData={initialData}
              contacts={contacts}
              teamGroups={teamGroups}
              roleGroups={roleGroups}
              onSendComplete={handleSendComplete}
              onCancel={handleCancel}
            />
          </Box>
        </Box>
      </main>
    </ProtectedRoute>
  );
}
