'use client';

import { Box, Typography, Alert, AlertTitle, Card, CardContent, Button } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

export default function TemplatesPage() {
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
        Email Templates
      </Typography>

      <Card>
        <CardContent>
          <Alert severity="info">
            <AlertTitle>Templates Coming in Phase 2</AlertTitle>
            Email template management will be available in Phase 2, allowing you to create reusable
            email templates with variable substitution for common communications.
          </Alert>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Planned Template Features:
            </Typography>
            <ul>
              <li>Pre-designed templates for common scenarios</li>
              <li>
                Variable substitution ({'{'}firstName{'}'}, {'{'}teamName{'}'}, etc.)
              </li>
              <li>Rich text editor for template creation</li>
              <li>Template preview with sample data</li>
              <li>Template sharing across account users</li>
              <li>Template categories and organization</li>
            </ul>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
