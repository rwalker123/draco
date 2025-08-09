'use client';

import { Box, Typography, Alert, AlertTitle, Card, CardContent, Button } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

export default function HistoryPage() {
  const { accountId } = useParams();
  const router = useRouter();

  const handleBack = () => {
    router.push(`/account/${accountId}/communications`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
        Back to Communications
      </Button>

      <Typography variant="h4" component="h1" gutterBottom>
        Email History
      </Typography>

      <Card>
        <CardContent>
          <Alert severity="info">
            <AlertTitle>Email History Coming in Phase 2</AlertTitle>
            Email history and tracking will be available in Phase 2, providing detailed information
            about sent emails and their delivery status.
          </Alert>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Planned History Features:
            </Typography>
            <ul>
              <li>Complete history of all sent emails</li>
              <li>Delivery status tracking (sent, delivered, opened, clicked)</li>
              <li>Recipient-level detail views</li>
              <li>Email performance metrics</li>
              <li>Search and filtering capabilities</li>
              <li>Export options for reporting</li>
            </ul>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
