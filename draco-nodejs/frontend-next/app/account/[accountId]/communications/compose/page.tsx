'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Alert, AlertTitle, Card, CardContent, Button } from '@mui/material';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

export default function ComposePage() {
  const { accountId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'quick' | 'advanced'>('advanced');

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'quick') {
      setMode('quick');
    }
  }, [searchParams]);

  const handleBack = () => {
    router.push(`/account/${accountId}/communications`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
        Back to Communications
      </Button>

      <Typography variant="h4" component="h1" gutterBottom>
        {mode === 'quick' ? 'Quick Email' : 'Compose Email'}
      </Typography>

      <Card>
        <CardContent>
          <Alert severity="info">
            <AlertTitle>Feature Coming Soon</AlertTitle>
            {mode === 'quick' ? (
              <>
                Quick email composition is coming in Phase 1. For now, you can use the email buttons
                throughout the application to open your default email client.
              </>
            ) : (
              <>
                Advanced email composition with templates, attachments, and bulk sending will be
                available in Phase 2 of the email system implementation.
              </>
            )}
          </Alert>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              What&apos;s Coming:
            </Typography>
            <ul>
              <li>Rich text email editor</li>
              <li>Recipient group selection (teams, roles, custom lists)</li>
              <li>Email templates with variable substitution</li>
              <li>File attachments</li>
              <li>Email scheduling</li>
              <li>Delivery tracking and analytics</li>
            </ul>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
