import { useMemo, useCallback } from 'react';
import { Box, Button, CircularProgress, Alert, Typography } from '@mui/material';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

import { EmailComposePage } from '../../../../../components/emails/compose';
import { useEmailRecipients, useCurrentSeason } from '../../../../../hooks/useEmailRecipients';
import { EmailComposeRequest } from '../../../../../types/emails/email';
import AccountPageHeader from '@/components/AccountPageHeader';

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
    isLoading: recipientsLoading,
    error: recipientsError,
    refresh: refreshRecipients,
  } = useEmailRecipients(accountId as string, currentSeason?.id);

  const initialData = useMemo(() => {
    const templateId = searchParams.get('template');
    const subject = searchParams.get('subject');
    const body = searchParams.get('body');

    if (!subject && !body && !templateId) {
      return undefined;
    }

    return {
      subject: subject ?? '',
      body: body ?? '',
      templateId: templateId ?? undefined,
    } satisfies Partial<EmailComposeRequest>;
  }, [searchParams]);

  // Combined loading and error states
  const loading = seasonLoading || recipientsLoading;
  const error = seasonError || recipientsError;

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
      <Box
        component="main"
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '50vh',
            gap: 2,
          }}
        >
          <CircularProgress size={48} />
          <Typography variant="body1" color="text.secondary">
            Loading email composer...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box component="main" sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Account Header */}
        <AccountPageHeader accountId={accountId as string}>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            sx={{ position: 'relative' }}
          >
            <Box sx={{ flex: 1, textAlign: 'center', mb: 2 }}>
              <Typography variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
                Compose Email
              </Typography>
            </Box>
          </Box>
        </AccountPageHeader>

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
      </Box>
    );
  }

  // Render the complete email compose interface
  return (
    <Box component="main" sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Account Header */}
      <AccountPageHeader accountId={accountId as string}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          sx={{ position: 'relative' }}
        >
          <Box sx={{ flex: 1, textAlign: 'center', mb: 2 }}>
            <Typography variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
              Compose Email
            </Typography>
          </Box>
        </Box>
      </AccountPageHeader>

      <Box sx={{ minHeight: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
        {/* Navigation Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack} size="small" color="inherit">
            Back to Communications
          </Button>
        </Box>

        {/* Main Compose Interface */}
        <Box sx={{ flex: 1, bgcolor: 'background.default' }}>
          <EmailComposePage
            accountId={accountId as string}
            seasonId={currentSeason?.id}
            initialData={initialData}
            onSendComplete={handleSendComplete}
            onCancel={handleCancel}
          />
        </Box>
      </Box>
    </Box>
  );
}
