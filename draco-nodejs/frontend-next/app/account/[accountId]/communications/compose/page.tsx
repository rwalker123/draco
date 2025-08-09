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
          <Alert severity="warning">
            <AlertTitle>Frontend UI In Development</AlertTitle>
            {mode === 'quick' ? (
              <>
                Quick email composition frontend is being built. For now, you can use the email
                buttons throughout the application to open your default email client.
              </>
            ) : (
              <>
                Advanced email composition backend is ready! The rich text editor and attachment UI
                are being developed. APIs support bulk sending, templates, and delivery tracking.
              </>
            )}
          </Alert>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Backend Features Ready:
            </Typography>
            <ul>
              <li>✅ Bulk email sending with queue processing</li>
              <li>✅ Email templates with variable substitution</li>
              <li>✅ Provider-aware rate limiting (SendGrid + Ethereal)</li>
              <li>✅ Email status tracking and analytics</li>
              <li>⏳ File attachments (in development)</li>
              <li>⏳ Email scheduling (in development)</li>
            </ul>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Frontend UI Coming Next:
            </Typography>
            <ul>
              <li>🔨 Rich text email editor (Quill.js)</li>
              <li>🔨 Advanced recipient selection interface</li>
              <li>🔨 Template management UI</li>
              <li>🔨 File attachment upload component</li>
              <li>🔨 Email history and analytics dashboard</li>
            </ul>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
