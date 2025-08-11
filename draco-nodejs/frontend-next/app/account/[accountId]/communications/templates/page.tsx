'use client';

import { Box, Typography, Alert, AlertTitle, Card, CardContent, Button } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';

export default function TemplatesPage() {
  const { accountId } = useParams();
  const router = useRouter();

  const handleBack = () => {
    router.push(`/account/${accountId}/communications`);
  };

  return (
    <ProtectedRoute requiredRole={['ContactAdmin', 'AccountAdmin']} checkAccountBoundary={true}>
      <Box sx={{ p: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          Back to Communications
        </Button>

        <Typography variant="h4" component="h1" gutterBottom>
          Email Templates
        </Typography>

        <Card>
          <CardContent>
            <Alert severity="success">
              <AlertTitle>Template Backend Ready!</AlertTitle>
              Email template management backend is complete with full CRUD operations and variable
              substitution. The management UI is being developed to provide an intuitive interface.
            </Alert>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Available Template Features:
              </Typography>
              <ul>
                <li>✅ Complete template CRUD API endpoints</li>
                <li>
                  ✅ Variable substitution ({'{'}firstName{'}'}, {'{'}teamName{'}'}, etc.)
                </li>
                <li>✅ Template storage with account isolation</li>
                <li>✅ Template validation and error handling</li>
                <li>🔨 Rich text editor UI (in development)</li>
                <li>🔨 Template preview interface (in development)</li>
                <li>🔨 Template management dashboard (in development)</li>
                <li>🔨 Template categories and organization (in development)</li>
              </ul>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </ProtectedRoute>
  );
}
