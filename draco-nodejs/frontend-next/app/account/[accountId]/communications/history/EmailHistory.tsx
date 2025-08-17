import { Box, Typography, Alert, AlertTitle, Card, CardContent, Button } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';

export default function EmailHistory() {
  const { accountId } = useParams();
  const router = useRouter();

  const handleBack = () => {
    router.push(`/account/${accountId}/communications`);
  };

  return (
    <ProtectedRoute requiredRole="AccountAdmin" checkAccountBoundary={true}>
      <main className="min-h-screen bg-background">
        <Box sx={{ p: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
            Back to Communications
          </Button>

          <Typography variant="h4" component="h1" gutterBottom>
            Email History
          </Typography>

          <Card>
            <CardContent>
              <Alert severity="success">
                <AlertTitle>Email Tracking Backend Complete!</AlertTitle>
                Email history and delivery tracking backend is fully implemented with comprehensive
                recipient status tracking, analytics, and reporting. The dashboard UI is in
                development.
              </Alert>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Available Tracking Features:
                </Typography>
                <ul>
                  <li>✅ Complete email history database storage</li>
                  <li>✅ Delivery status tracking (sent, delivered, failed, partial)</li>
                  <li>✅ Individual recipient status and error tracking</li>
                  <li>✅ Email performance analytics APIs</li>
                  <li>✅ Real-time queue processing metrics</li>
                  <li>🔨 History dashboard UI (in development)</li>
                  <li>🔨 Search and filtering interface (in development)</li>
                  <li>🔨 Analytics visualizations (in development)</li>
                  <li>🔨 Export functionality (in development)</li>
                </ul>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </main>
    </ProtectedRoute>
  );
}
